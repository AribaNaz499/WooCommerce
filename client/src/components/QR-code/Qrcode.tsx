import { QRCodeSVG } from "qrcode.react";

type QrGeneratorProps = {
  url: string | any;
  size?: number;
  style?: React.CSSProperties;
};

const QrGenerator = ({ url, style, size }: QrGeneratorProps) => {
  const qrSize = size || 68;

  return (
    <div
      style={{
        width: qrSize,
        height: qrSize,
        minWidth: qrSize,
        minHeight: qrSize,
        flexShrink: 0,
        ...style,
      }}
    >
      <QRCodeSVG
        value={url}
        size={qrSize}
        style={{
          width: qrSize,
          height: qrSize,
          minWidth: qrSize,
          minHeight: qrSize,
          display: "block",
        }}
      />
    </div>
  );
};

export default QrGenerator;
