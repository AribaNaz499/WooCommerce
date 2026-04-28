import { Box, Typography } from '@mui/material'
import { COLORS } from '../../../constant/color'

const StickerLine = () => {
  return (
    <Box 
    sx={{
        p:{md:1.5,sm:3,xs:1},
        bgcolor:COLORS.seconday,
        textAlign:'center',
        display:'flex',
        justifyContent:'center',
        m:'auto'
    }}
    >
        <Typography sx={{fontSize:{md:'16px',sm:'20px',xs:'12px'},fontWeight:700}}>Make it personal! <span style={{fontWeight:400}}>🥳 Add stickers, photos & more</span></Typography>
    </Box>
  )
}

export default StickerLine