import { Box} from '@mui/material'
import DraftSlider from '../../../../components/SaveDraftCardSlider/SaveDraftCardSlider'
import { USER_ROUTES } from '../../../../constant/route';
import { useEffect, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const DraftsCard = () => {

    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sp] = useSearchParams();

    // ✅ you can pass auto-open draft id via state OR query
    const autoOpenDraftId = useMemo(() => {
        const st: any = location.state;
        return st?.openDraftId || sp.get("openDraftId") || null;
    }, [location.state, sp]);

    // ✅ Only authenticated user can see drafts
    useEffect(() => {
        if (loading) return;
        if (!user) {
            navigate(USER_ROUTES.SIGNIN); // change if your login route differs
        }
    }, [user, loading, navigate]);

    return (
        <div>
            <Box
                sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minHeight: "80vh",
                    m: "auto",
                }}
            >
                <DraftSlider autoOpenCardId={autoOpenDraftId ?? undefined}  isUserProfile />
            </Box>
        </div>
    )
}

export default DraftsCard