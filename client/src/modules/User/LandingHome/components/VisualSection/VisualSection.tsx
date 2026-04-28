import { Box, Typography } from '@mui/material';
import { COLORS } from '../../../../../constant/color';


const steps = [
    {
        step: 1,
        title: "Pick Your Design",
        description: "Choose from beautiful templates for every celebration and moment.",
        color: COLORS.primary
    },
    {
        step: 2,
        title: "Add Your Personal Touch",
        description: "Photos, names, messages and more, make it as meaningful or fun as you like",
        color: COLORS.seconday
    },
    {
        step: 3,
        title: "Print & Create",
        description: `Pay and receive a high resolution print ready file instantly in your inbox. Print at home, at work or in a store, you can apply your design to your own blanks for personalised gifts.`,
        color: COLORS.green
    }
]

const VisualSection = () => {
    return (
        <Box py={3}>
            <Typography sx={{ fontSize: { md: 30, sm: 25, xs: 20 }, fontWeight: 600, textAlign: 'center' }}>
                DIY Personalisations 3 step Process
            </Typography>

            <Box sx={{ display: {md:'flex',sm:'flex',xs:'block'}, m: 'auto', justifyContent: 'center', alignItems: 'center', mt: 5, gap: 3, }}>
                {steps.map((e) => (
                    <Box sx={{ width: '100%', textAlign: 'center', p: 2, boxShadow: 3, height: { md: 270, sm: 'auto', xs: 'auto' }, borderRadius: 2 }} key={e.step}>
                        <Typography sx={{ fontSize: 22, fontWeight: 700, p: 2, borderRadius: 50, bgcolor: e.color, width: 60, height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', m: 'auto', color: COLORS.white, border: '2px solid white', outline: `1px solid ${e.color}` }}>
                            {e.step}
                        </Typography>
                        <Typography sx={{ textAlign: 'center', fontWeight: 'bold', p: 1, fontSize: 18, mt: 2 }}>
                            {e.title}
                        </Typography>
                        <Typography sx={{ textAlign: 'center', color: '#4e4e4eff', fontSize: 16 }}>
                            {e.description}
                        </Typography>

                    </Box>
                ))}
            </Box>
            <br />
            {/* <Typography sx={{ mt: 2, color: '#4e4e4eff', fontWeight: 100, }}>
                Let us show you how with our Video tutorials <Link href={'#'}>How to Guide</Link>.
            </Typography> */}

        </Box >
    )
}

export default VisualSection