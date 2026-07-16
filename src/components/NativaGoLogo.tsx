interface Props {
  size?: 'sm' | 'md' | 'lg';
  context?: 'onDark' | 'onLight';
}

const maxWidths = { sm: 220, md: 300, lg: 400 };

export function NativaGoLogo({ size = 'md', context = 'onDark' }: Props) {
  const maxW = maxWidths[size];

  if (context === 'onDark') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.jpeg"
        alt="NativaGo"
        style={{
          width: '100%',
          maxWidth: maxW,
          height: 'auto',
          display: 'block',
          mixBlendMode: 'screen',
          filter:
            'drop-shadow(0 0 18px rgba(14,165,164,0.85)) drop-shadow(0 0 8px rgba(249,115,22,0.7))',
        }}
      />
    );
  }

  return (
    <div
      style={{
        background: '#090d16',
        borderRadius: 12,
        padding: '3px 12px 3px 6px',
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.jpeg"
        alt="NativaGo"
        style={{
          width: '100%',
          maxWidth: maxW,
          height: 'auto',
          display: 'block',
        }}
      />
    </div>
  );
}
