using System.Drawing;
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
    private CompanionState state = CompanionState.Off;

    public CompanionApplicationContext()
    {
        stateItem = new ToolStripMenuItem();
        stateItem.Enabled = false;

        var menu = new ContextMenuStrip();
        menu.Items.Add(stateItem);
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
        trayIcon.DoubleClick += (_, _) => SetState(CompanionState.WaitingForAuren);

        SetState(CompanionState.Off);
        WriteLog("companion_started");
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
            ? "Esqueleto ativo. O áudio nativo ainda não foi habilitado."
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

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            WriteLog($"companion_stopped:{state}");
            trayIcon.Visible = false;
            trayIcon.Dispose();
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
