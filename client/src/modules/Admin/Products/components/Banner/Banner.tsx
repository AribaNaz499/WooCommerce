import React, { useState, useRef, type ChangeEvent } from 'react';
import { Box } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const OfferBanner: React.FC = () => {
  const [image, setImage] = useState<string>('/assets/images/animated-banner.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: {md:'400px',sm:'400px',xs:'200px'},
        overflow: 'hidden',
        borderRadius: '12px',
        position: 'relative',
        cursor: 'pointer',
        '&:hover .overlay': {
          opacity: 1,
        },
      }}
      onClick={handleClick}
    >
      <Box
        component={'img'}
        src={image}
        alt="Offer Banner"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <Box
        className="overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          opacity: 0,
          transition: 'opacity 0.3s',
        }}
      >
        <AddCircleOutlineIcon sx={{ color: 'white', fontSize: 60 }} />
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </Box>
  );
};

export default OfferBanner;