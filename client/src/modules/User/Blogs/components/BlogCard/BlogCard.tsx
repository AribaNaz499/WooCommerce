import { Box, Typography } from '@mui/material';
import { COLORS } from '../../../../../constant/color';
import { useNavigate } from 'react-router-dom';
import { USER_ROUTES } from '../../../../../constant/route';

type BlogCardType = { data: { id: string; title: string; content_html?: string; image_base64?: string } };

const BlogCard = ({ data }: BlogCardType) => {
    const navigate = useNavigate();

    return (
        <Box
            onClick={() => navigate(`${USER_ROUTES.OUR_BLOGS_DETAILS}/${data.id}`)}
            sx={{
                width: { md: 280, sm: 250, xs: '100%' },
                height: 'auto',
                overflow: 'hidden',
                cursor: 'pointer',
                border:'1px solid lightGray',
                borderRadius:2,
                boxShadow:2,
                "&:hover .underlineText": { textDecoration: "underline", }
            }}
        >
            <Box
                component="img"
                src={data?.image_base64 || '/assets/images/blogs.jpg'}
                sx={{ width: '100%', height: 300, objectFit: 'fill', borderRadius: 1 }}
            />
            <Typography className="underlineText" sx={{ fontSize: 22, fontWeight: 600, color: COLORS.seconday, p: 1 }}>
                {(data.title || '').slice(0, 25)}
            </Typography>
        </Box>
    );
};

export default BlogCard;