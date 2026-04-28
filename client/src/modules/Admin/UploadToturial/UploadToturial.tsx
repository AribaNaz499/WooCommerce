// src/pages/Dashboard/UploadToturial/index.tsx
import { useState } from 'react';
import {
    Box,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Typography,
    Tooltip,
} from '@mui/material';
import { Delete, Edit, MoreVert, YouTube } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../layout/DashboardLayout';
import useModal from '../../../hooks/useModal';
import UploadModal from './components/UploadModal/UploadModal';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import toast from 'react-hot-toast';
import { deleteTutorial, fetchAllTutorials } from '../../../source/source';

// Parse a YouTube URL into video id (supports watch, youtu.be, embed, shorts)
function getYouTubeId(url: string | undefined | null): string | null {
    if (!url) return null;
    try {
        const u = new URL(url);
        // ?v=ID
        const v = u.searchParams.get('v');
        if (v) return v;
        // /embed/ID or /shorts/ID or youtu.be/ID
        const parts = u.pathname.split('/').filter(Boolean);
        // youtu.be/<id>
        if (u.hostname.includes('youtu.be') && parts[0]) return parts[0];
        // /embed/<id>
        const embedIdx = parts.indexOf('embed');
        if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
        // /shorts/<id>
        const shortsIdx = parts.indexOf('shorts');
        if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    } catch {
        // ignore
    }
    return null;
}

const UploadToturial = () => {
    const qc = useQueryClient();

    // ---------- Fetch tutorials ----------
    const {
        data: tutorials = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['tutorials'],
        queryFn: fetchAllTutorials,
        staleTime: 60_000,
    });

    // ---------- Upload/Edit modal ----------
    const { open: isVideoModal, openModal: openVideoModal, closeModal: closeVideoModal } = useModal();
    const [editInitial, setEditInitial] = useState<any | null>(null);
    const [mode, setMode] = useState<'add' | 'edit'>('add');

    const openAdd = () => {
        setMode('add');
        setEditInitial(null);
        openVideoModal();
    };
    const openEdit = (row: any) => {
        setMode('edit');
        setEditInitial(row);
        openVideoModal();
    };

    // ---------- Delete confirm ----------
    const { open: isConfirmOpen, openModal: openConfirm, closeModal: closeConfirm } = useModal();
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTutorial(id),
        onSuccess: () => {
            toast.success('Tutorial deleted');
            qc.invalidateQueries({ queryKey: ['tutorials'] });
            closeConfirm();
            setConfirmDeleteId(null);
        },
        onError: (err: any) => toast.error(err?.message || 'Delete failed'),
    });

    // ---------- Card menu state ----------
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuRow, setMenuRow] = useState<any | null>(null);

    const openMenu = (e: React.MouseEvent<HTMLElement>, row: any) => {
        setMenuAnchor(e.currentTarget);
        setMenuRow(row);
    };
    const closeMenu = () => {
        setMenuAnchor(null);
        setMenuRow(null);
    };

    const openOnYouTube = (youtube_url?: string) => {
        const id = getYouTubeId(youtube_url || '');
        if (!id) {
            toast.error('Invalid YouTube URL');
            return;
        }
        const watchUrl = `https://www.youtube.com/watch?v=${id}`;
        window.open(watchUrl, '_blank', 'noopener');
    };

    return (
        <DashboardLayout title="How To Guide !!" addBtn="Add Toturial" onClick={openAdd}>
            {/* Loading / Error */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            )}
            {isError && (
                <Typography color="error" sx={{ textAlign: 'center', py: 6 }}>
                    Failed to load tutorials.
                </Typography>
            )}

            {/* Grid */}
            {!isLoading && !isError && (
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        gap: 3,
                        flexWrap: 'wrap',
                    }}
                >
                    {tutorials.map((t) => {
                        const hasVideo = Boolean(getYouTubeId(t.youtube_url));
                        return (
                            <Box
                                key={t.id}
                                sx={{
                                    position: 'relative',
                                    width: { md: 300, sm: 300, xs: '100%' },
                                    height: 200,
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    boxShadow: 2,
                                    bgcolor: '#0f0f0f',
                                    cursor: hasVideo ? 'pointer' : 'default',
                                    '&:hover .hoverOverlay': {
                                        opacity: 1,
                                        visibility: 'visible',
                                    },
                                }}
                            >
                                {/* Thumbnail */}
                                <Box
                                    component="img"
                                    src={t.thumbnail_base64}
                                    alt={t.title}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />

                                {/* Center YouTube Play Button */}
                                <Tooltip title={hasVideo ? 'Play on YouTube' : 'Invalid YouTube URL'}>
                                    <IconButton
                                        onClick={() => hasVideo && openOnYouTube(t.youtube_url)}
                                        disabled={!hasVideo}
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: 44,
                                            height: 44,
                                            zIndex: 999,
                                            borderRadius: '50%',
                                            bgcolor: 'white',
                                            transition: 'transform .15s ease, background .2s',
                                            '&:hover': {
                                                transform: 'translate(-50%, -50%) scale(1.05)',
                                                bgcolor: '#fff',
                                            },
                                        }}
                                    >
                                        <YouTube sx={{ fontSize: 42, color: 'red' }} />
                                    </IconButton>
                                </Tooltip>

                                {/* Hover overlay (top-right menu) */}
                                <Stack
                                    className="hoverOverlay"
                                    direction="row"
                                    justifyContent="flex-end"
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        visibility: 'hidden',
                                        transition: 'opacity 0.2s ease',
                                        p: 1,
                                        zIndex: 99,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))',
                                    }}
                                >
                                    <IconButton
                                        onClick={(e) => openMenu(e, t)}
                                        sx={{
                                            ml: 'auto',
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                            '&:hover': { bgcolor: '#fff' },
                                            width: 36,
                                            height: 36,
                                        }}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </Stack>

                                {/* Title footer */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        p: 1.5,
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)',
                                    }}
                                >
                                    <Typography sx={{ fontSize: 14, fontWeight: 700 }} noWrap title={t.title}>
                                        {t.title}
                                    </Typography>
                                </Box>

                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* Menu (Edit/Delete) */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
                <MenuItem
                    onClick={() => {
                        if (menuRow) openEdit(menuRow);
                        closeMenu();
                    }}
                >
                    <Edit fontSize="small" style={{ marginRight: 4 }} />
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (menuRow) {
                            setConfirmDeleteId(menuRow.id);
                            openConfirm();
                        }
                        closeMenu();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <Delete fontSize="small" style={{ marginRight: 4 }} />
                </MenuItem>
            </Menu>

            {/* Upload (Add/Edit) */}
            {isVideoModal && (
                <UploadModal
                    open={isVideoModal}
                    onCloseModal={closeVideoModal}
                    mode={mode}
                    initial={editInitial}
                    onSaved={() => {
                        qc.invalidateQueries({ queryKey: ['tutorials'] });
                        closeVideoModal();
                        setEditInitial(null);
                    }}
                />
            )}

            {/* Delete Confirm */}
            {isConfirmOpen && confirmDeleteId != null && (
                <ConfirmModal
                    open={isConfirmOpen}
                    onCloseModal={() => {
                        closeConfirm();
                        setConfirmDeleteId(null);
                    }}
                    title="Are you sure you want to delete this tutorial?"
                    icon={<Delete fontSize="large" />}
                    btnText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
                />
            )}
        </DashboardLayout>
    );
};

export default UploadToturial;
