import { useTheme } from './useTheme.ts';
import { themePreferences, type ThemePreference } from './theme.ts';

const preferenceLabels: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

/**
 * Appearance control.
 *
 * A radio group rather than a two-state switch, because "follow the system"
 * is a distinct choice from "always dark" and must stay selectable once the
 * user has overridden it.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className="theme-toggle">
      <legend>Appearance</legend>
      {themePreferences.map((option) => (
        <label key={option} className="theme-toggle-option">
          <input
            type="radio"
            name="graphene-appearance"
            value={option}
            checked={preference === option}
            onChange={() => setPreference(option)}
          />
          {preferenceLabels[option]}
        </label>
      ))}
    </fieldset>
  );
}
