interface Props {
  size?: 'sm' | 'md' | 'lg';
  context?: 'onDark' | 'onLight';
}

const maxWidths = { sm: 220, md: 300, lg: 400 };

export function NativaGoLogo({ size = 'md', context = 'onDark' }: Props) {
  const maxW = maxWidths[size];
  const src = context === 'onDark' ? '/logo-white.png' : '/logo-black.png';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="NativaGo"
      style={{
        width: '100%',
        maxWidth: maxW,
        height: 'auto',
        display: 'block',
      }}
    />
  );
}
