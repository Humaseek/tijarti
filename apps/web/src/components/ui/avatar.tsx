interface AvatarProps {
  name?: string;
  /** Override the letter shown. Defaults to the first char of `name`. */
  initial?: string;
  size?: number;
  /** Custom background color (hex/rgb). Falls back to hash-based palette. */
  bg?: string;
}

const HASH_COLORS = ["#BA7517", "#0F6E56", "#2563A6", "#A32D2D", "#6B4B8F"];

function hashIndex(s: string, mod: number): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum % mod;
}

export function Avatar({ name = "", initial, size = 40, bg }: AvatarProps) {
  const color = bg || HASH_COLORS[hashIndex(name, HASH_COLORS.length)];
  const letter = initial || name.charAt(0) || "?";
  return (
    <div
      className="flex items-center justify-center text-white font-bold font-ar flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: color,
        fontSize: size * 0.42,
      }}
    >
      {letter}
    </div>
  );
}
