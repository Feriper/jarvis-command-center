using System.Globalization;
using System.Speech.Synthesis;

namespace Auren.Companion;

static class SpeechService
{
    private static readonly object Sync = new();
    private static SpeechSynthesizer? synthesizer;

    public static Task SpeakAsync(string text)
    {
        var cleanText = text.Trim();
        if (cleanText.Length == 0) return Task.CompletedTask;
        if (cleanText.Length > 6000) cleanText = cleanText[..6000];

        lock (Sync)
        {
            synthesizer ??= CreateSynthesizer();
            synthesizer.SpeakAsyncCancelAll();
            synthesizer.SpeakAsync(cleanText);
        }
        return Task.CompletedTask;
    }

    public static void Stop()
    {
        lock (Sync)
        {
            synthesizer?.SpeakAsyncCancelAll();
        }
    }

    public static IReadOnlyList<string> GetInstalledVoices()
    {
        lock (Sync)
        {
            synthesizer ??= CreateSynthesizer();
            return synthesizer.GetInstalledVoices()
                .Select(voice => voice.VoiceInfo.Name)
                .ToArray();
        }
    }

    private static SpeechSynthesizer CreateSynthesizer()
    {
        var value = new SpeechSynthesizer();
        var ptBr = value.GetInstalledVoices()
            .Select(voice => voice.VoiceInfo)
            .FirstOrDefault(info => info.Culture.Name.Equals("pt-BR", StringComparison.OrdinalIgnoreCase));
        var pt = value.GetInstalledVoices()
            .Select(voice => voice.VoiceInfo)
            .FirstOrDefault(info => info.Culture.TwoLetterISOLanguageName.Equals("pt", StringComparison.OrdinalIgnoreCase));
        if (ptBr is not null) value.SelectVoice(ptBr.Name);
        else if (pt is not null) value.SelectVoice(pt.Name);
        else value.SelectVoiceByHints(VoiceGender.Neutral, VoiceAge.Adult, 0, CultureInfo.GetCultureInfo("pt-BR"));
        value.Rate = 0;
        value.Volume = 100;
        return value;
    }
}
