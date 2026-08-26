using System.Diagnostics;
using System.Drawing;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Windows.Forms;

namespace Auren.Companion;

enum CompanionState
{
    Off,
    WaitingForAuren,
    Paused,
    Error,
}

sealed class CompanionApplicationContext : ApplicationContext
{
    private readonly NotifyIcon trayIcon;
    private readonly ToolStripMenuItem stateItem;
    private readonly MainForm mainForm;
    private CompanionState state = CompanionState.Off;

    public CompanionApplicationContext()
    {
        stateItem = new ToolStripMenuItem { Enabled = false };
        mainForm = new MainForm(this);

        var menu = new ContextMenuStrip();
        menu.Items.Add(stateItem);
        menu.Items.Add(new ToolStripSeparator());

        var openItem = new ToolStripMenuItem("Abrir Auren");
        openItem.Click += (_, _) => OpenAuren();
        menu.Items.Add(openItem);

        var checkUpdateItem = new ToolStripMenuItem("Verificar atualização");
        checkUpdateItem.Click += async (_, _) => await mainForm.CheckForUpdatesAsync();
        menu.Items.Add(checkUpdateItem);

        var updateItem = new ToolStripMenuItem("Atualizar Auren");
        updateItem.Click += (_, _) => mainForm.LaunchUpdate();
        menu.Items.Add(updateItem);

        var speakItem = new ToolStripMenuItem("Testar voz local");
        speakItem.Click += (_, _) => _ = SpeechService.SpeakAsync("Olá, Feripe. Esta é a voz local do Auren.");
        menu.Items.Add(speakItem);

        var stopSpeechItem = new ToolStripMenuItem("Parar voz");
        stopSpeechItem.Click += (_, _) => SpeechService.Stop();
        menu.Items.Add(stopSpeechItem);

        menu.Items.Add(new ToolStripSeparator());
        var waitingItem = new ToolStripMenuItem("Ativar estado de espera");
        waitingItem.Click += (_, _) => SetState(CompanionState.WaitingForAuren);
        menu.Items.Add(waitingItem);

        var pauseItem = new ToolStripMenuItem("Pausar áudio e automação");
        pauseItem.Click += (_, _) => SetState(CompanionState.Paused);
        menu.Items.Add(pauseItem);

        var offItem = new ToolStripMenuItem("Desativar");
        offItem.Click += (_, _) => SetState(CompanionState.Off);
        menu.Items.Add(offItem);

        menu.Items.Add(new ToolStripSeparator());
        var exitItem = new ToolStripMenuItem("Sair do Auren Companion");
        exitItem.Click += (_, _) => ExitThread();
        menu.Items.Add(exitItem);

        trayIcon = new NotifyIcon
        {
            Icon = SystemIcons.Application,
            ContextMenuStrip = menu,
            Visible = true,
            Text = "Auren Companion — OFF",
        };
        trayIcon.DoubleClick += (_, _) => OpenAuren();

        SetState(CompanionState.Off);
        WriteLog("companion_started");
    }

    public void OpenAuren()
    {
        if (mainForm.IsDisposed) return;
        mainForm.Show();
        mainForm.WindowState = FormWindowState.Normal;
        mainForm.BringToFront();
        mainForm.Activate();
    }

    private void SetState(CompanionState next)
    {
        state = next;
        var label = next switch
        {
            CompanionState.Off => "OFF",
            CompanionState.WaitingForAuren => "WAITING FOR AUREN",
            CompanionState.Paused => "PAUSED",
            CompanionState.Error => "ERROR",
            _ => "UNKNOWN",
        };

        stateItem.Text = $"Estado: {label}";
        trayIcon.Text = $"Auren Companion — {label}";
        trayIcon.BalloonTipTitle = "Auren Companion";
        trayIcon.BalloonTipText = next == CompanionState.WaitingForAuren
            ? "Estado de espera ativo. O áudio nativo ainda está desligado nesta versão."
            : $"Estado alterado para {label}.";

        if (next != CompanionState.Off)
        {
            trayIcon.ShowBalloonTip(1200);
        }
        WriteLog($"state_changed:{label}");
    }

    private static void WriteLog(string eventName)
    {
        var directory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Auren",
            "companion");
        Directory.CreateDirectory(directory);
        var logPath = Path.Combine(directory, "companion.log");
        File.AppendAllText(logPath, $"{DateTimeOffset.UtcNow:O}\t{eventName}{Environment.NewLine}");
    }

    protected override void ExitThreadCore()
    {
        if (!mainForm.IsDisposed) mainForm.Close();
        base.ExitThreadCore();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            WriteLog($"companion_stopped:{state}");
            trayIcon.Visible = false;
            trayIcon.Dispose();
            mainForm.Dispose();
        }
        base.Dispose(disposing);
    }
}

sealed class MainForm : Form
{
    private readonly CompanionApplicationContext context;
    private readonly WebView2 webView;
    private readonly Label updateStatus;
    private readonly Button updateButton;
    private readonly string serverUrl;

    public MainForm(CompanionApplicationContext context)
    {
        this.context = context;
        serverUrl = Environment.GetEnvironmentVariable("AUREN_SERVER_URL")?.Trim() is { Length: > 0 } configured
            ? configured
            : "http://127.0.0.1:3000";

        Text = "Auren";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(900, 620);
        Width = 1280;
        Height = 820;
        BackColor = Color.FromArgb(33, 33, 33);

        var toolbar = new Panel
        {
            Dock = DockStyle.Top,
            Height = 48,
            Padding = new Padding(12, 8, 12, 8),
            BackColor = Color.FromArgb(23, 23, 23),
        };

        var title = new Label
        {
            AutoSize = true,
            Text = "Auren",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 13, FontStyle.Bold),
            Location = new Point(16, 13),
        };
        toolbar.Controls.Add(title);

        var toolbarActions = new FlowLayoutPanel
        {
            Dock = DockStyle.Right,
            AutoSize = true,
            WrapContents = false,
            FlowDirection = FlowDirection.LeftToRight,
            Padding = new Padding(0, 4, 0, 0),
            BackColor = Color.Transparent,
        };
        toolbar.Controls.Add(toolbarActions);

        updateStatus = new Label
        {
            AutoSize = true,
            Text = "Atualização: verificando...",
            ForeColor = Color.FromArgb(160, 170, 180),
            Font = new Font("Segoe UI", 9),
            Margin = new Padding(0, 7, 12, 0),
        };
        toolbarActions.Controls.Add(updateStatus);

        updateButton = new Button
        {
            AutoSize = true,
            Text = "Verificar atualização",
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(43, 43, 43),
            ForeColor = Color.White,
            Height = 32,
            Margin = new Padding(0, 0, 0, 0),
        };
        updateButton.FlatAppearance.BorderColor = Color.FromArgb(75, 75, 75);
        updateButton.Click += async (_, _) => await CheckForUpdatesAsync();
        toolbarActions.Controls.Add(updateButton);

        webView = new WebView2 { Dock = DockStyle.Fill, BackColor = Color.FromArgb(33, 33, 33) };
        webView.NavigationStarting += HandleNavigationStarting;
        Controls.Add(webView);
        Controls.Add(toolbar);

        Shown += async (_, _) => await InitializeBrowserAsync();
        FormClosing += (_, e) =>
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                Hide();
            }
        };
    }

    private async Task InitializeBrowserAsync()
    {
        try
        {
            if (!await EnsureServerAvailableAsync())
            {
                throw new InvalidOperationException($"O servidor local do Auren não respondeu em {serverUrl}.");
            }

            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Auren",
                "webview");
            Directory.CreateDirectory(userDataFolder);
            var environment = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await webView.EnsureCoreWebView2Async(environment);
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            webView.CoreWebView2.WebMessageReceived += HandleWebMessageReceived;
            webView.Source = new Uri(serverUrl);
            await CheckForUpdatesAsync();
        }
        catch (WebView2RuntimeNotFoundException)
        {
            updateStatus.Text = "WebView2 Runtime ausente";
            updateButton.Text = "Abrir no navegador";
            updateButton.Click -= async (_, _) => await CheckForUpdatesAsync();
            updateButton.Click += (_, _) => OpenExternal(serverUrl);
            MessageBox.Show(
                "O Auren Companion precisa do Microsoft Edge WebView2 Runtime. Instale-o pelo site oficial da Microsoft e abra o companion novamente.",
                "Auren — componente ausente",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }
        catch (Exception error)
        {
            updateStatus.Text = "Servidor local não encontrado";
            MessageBox.Show($"Não consegui abrir o Auren local em {serverUrl}.\n\n{error.Message}", "Auren", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    private void HandleWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            var json = e.TryGetWebMessageAsString();
            var message = JsonSerializer.Deserialize<VoiceMessage>(json);
            if (message?.Type == "speak" && !string.IsNullOrWhiteSpace(message.Text))
            {
                _ = SpeechService.SpeakAsync(message.Text);
            }
            else if (message?.Type == "stop-speech")
            {
                SpeechService.Stop();
            }
        }
        catch
        {
            // Mensagens não relacionadas à voz são ignoradas pelo host.
        }
    }

    private sealed record VoiceMessage(string? Type, string? Text);

    private async Task<bool> EnsureServerAvailableAsync()
    {
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(1.5) };
        for (var attempt = 0; attempt < 2; attempt++)
        {
            try
            {
                using var response = await client.GetAsync(serverUrl);
                if ((int)response.StatusCode < 500) return true;
            }
            catch
            {
                // O servidor ainda pode estar iniciando.
            }
        }

        var root = UpdateService.FindProjectRoot();
        if (root is null) return false;
        var starter = Path.Combine(root, "Iniciar-Jarvis-Windows.bat");
        if (!File.Exists(starter)) return false;

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = starter,
                WorkingDirectory = root,
                UseShellExecute = true,
                WindowStyle = ProcessWindowStyle.Minimized,
            });
        }
        catch
        {
            return false;
        }

        for (var attempt = 0; attempt < 24; attempt++)
        {
            await Task.Delay(800);
            try
            {
                using var response = await client.GetAsync(serverUrl);
                if ((int)response.StatusCode < 500) return true;
            }
            catch
            {
                // Aguarda o Vite/Express inicializar.
            }
        }
        return false;
    }

    private void HandleNavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs e)
    {
        if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri)) return;
        var isLocal = uri.Scheme is "http" or "https" && (uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase));
        if (!isLocal)
        {
            e.Cancel = true;
            OpenExternal(e.Uri);
        }
    }

    public async Task CheckForUpdatesAsync()
    {
        updateButton.Enabled = false;
        updateStatus.Text = "Atualização: verificando...";
        try
        {
            var result = await UpdateService.CheckAsync();
            if (!result.RepositoryAvailable)
            {
                updateStatus.Text = "Atualização: cópia local";
                updateButton.Text = "Verificar atualização";
            }
            else if (result.IsAvailable)
            {
                updateStatus.Text = "Atualização nova disponível";
                updateButton.Text = "Clique para atualizar";
                updateButton.Click -= async (_, _) => await CheckForUpdatesAsync();
                updateButton.Click += (_, _) => LaunchUpdate();
            }
            else
            {
                updateStatus.Text = "Auren está atualizado";
                updateButton.Text = "Verificar atualização";
            }
        }
        catch
        {
            updateStatus.Text = "Atualização: não verificada";
        }
        finally
        {
            updateButton.Enabled = true;
        }
    }

    public void LaunchUpdate()
    {
        var root = UpdateService.FindProjectRoot();
        if (root is null)
        {
            MessageBox.Show("O atualizador precisa ser executado dentro de um clone Git do Auren.", "Auren", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }
        var answer = MessageBox.Show("Deseja buscar a versão mais recente do Auren no GitHub? Alterações locais não serão sobrescritas.", "Atualizar Auren", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        if (answer != DialogResult.Yes) return;
        try
        {
            var script = Path.Combine(root, "Atualizar-e-Iniciar-Auren.bat");
            Process.Start(new ProcessStartInfo
            {
                FileName = script,
                WorkingDirectory = root,
                UseShellExecute = true,
            });
            updateStatus.Text = "Atualização iniciada";
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "Não foi possível iniciar a atualização", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    private static void OpenExternal(string url)
    {
        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            SpeechService.Stop();
            webView.Dispose();
        }
        base.Dispose(disposing);
    }
}

static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new CompanionApplicationContext());
    }
}
