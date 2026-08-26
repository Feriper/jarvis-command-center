using System.Diagnostics;

namespace Auren.Companion;

sealed record UpdateStatus(
    bool RepositoryAvailable,
    bool IsAvailable,
    bool IsBlocked,
    string Message,
    string? LocalCommit = null,
    string? RemoteCommit = null);

static class UpdateService
{
    private const string MainBranch = "main";

    public static string? FindProjectRoot()
    {
        var configured = Environment.GetEnvironmentVariable("AUREN_PROJECT_ROOT");
        foreach (var start in new[] { configured, Environment.CurrentDirectory, AppContext.BaseDirectory })
        {
            if (string.IsNullOrWhiteSpace(start)) continue;
            var current = new DirectoryInfo(start);
            while (current is not null)
            {
                if (Directory.Exists(Path.Combine(current.FullName, ".git")) && File.Exists(Path.Combine(current.FullName, "Atualizar-e-Iniciar-Auren.bat")))
                {
                    return current.FullName;
                }
                current = current.Parent;
            }
        }
        return null;
    }

    public static async Task<UpdateStatus> CheckAsync()
    {
        var root = FindProjectRoot();
        if (root is null)
        {
            return new UpdateStatus(false, false, false, "Companion fora de um clone Git do Auren.");
        }

        var status = await RunGitAsync(root, "status", "--porcelain");
        if (status.ExitCode != 0)
        {
            return new UpdateStatus(true, false, true, "Não foi possível ler o estado do repositório.");
        }
        if (!string.IsNullOrWhiteSpace(status.StdOut))
        {
            return new UpdateStatus(true, false, true, "Há alterações locais; atualização bloqueada para proteger seus arquivos.");
        }

        var fetch = await RunGitAsync(root, "fetch", "--quiet", "origin", MainBranch);
        if (fetch.ExitCode != 0)
        {
            return new UpdateStatus(true, false, false, "Não foi possível consultar o GitHub agora.");
        }

        var local = await RunGitAsync(root, "rev-parse", "HEAD");
        var remote = await RunGitAsync(root, "rev-parse", $"origin/{MainBranch}");
        if (local.ExitCode != 0 || remote.ExitCode != 0)
        {
            return new UpdateStatus(true, false, false, "Não foi possível comparar as versões.");
        }

        var localCommit = local.StdOut.Trim();
        var remoteCommit = remote.StdOut.Trim();
        var available = !string.Equals(localCommit, remoteCommit, StringComparison.OrdinalIgnoreCase);
        return new UpdateStatus(
            true,
            available,
            false,
            available ? "Há uma atualização nova disponível." : "O Auren já está atualizado.",
            localCommit,
            remoteCommit);
    }

    private static async Task<GitResult> RunGitAsync(string workingDirectory, params string[] arguments)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "git",
                WorkingDirectory = workingDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            },
        };
        foreach (var argument in arguments) process.StartInfo.ArgumentList.Add(argument);

        try
        {
            process.Start();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(12));
            await process.WaitForExitAsync(timeout.Token);
            var stdout = await process.StandardOutput.ReadToEndAsync();
            var stderr = await process.StandardError.ReadToEndAsync();
            return new GitResult(process.ExitCode, stdout, stderr);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { /* processo já terminou */ }
            return new GitResult(-1, "", "timeout");
        }
        catch (Exception error)
        {
            return new GitResult(-1, "", error.Message);
        }
    }

    private sealed record GitResult(int ExitCode, string StdOut, string StdErr);
}
