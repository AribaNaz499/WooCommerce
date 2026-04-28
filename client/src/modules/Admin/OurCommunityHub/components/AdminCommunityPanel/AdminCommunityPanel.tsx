import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    IconButton,
    Divider,
    Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../../supabase/supabase";
import { COLORS } from "../../../../../constant/color";
import { Delete } from "@mui/icons-material";
import toast from "react-hot-toast";
import useModal from "../../../../../hooks/useModal";
import ConfirmModal from "../../../../../components/ConfirmModal/ConfirmModal";


const ADMIN_AVATAR = "/assets/icons/administrater.png";
const ADMIN_NAME = "Admin";

const AdminCommunityPanel = () => {
    const [selectedTopic, setSelectedTopic] = useState<any>(null);
    const [message, setMessage] = useState("");

    const [adminUser, setAdminUser] = useState<any>(null);
    const { open: isDeleteModal, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal()

    // Get logged-in admin
    useEffect(() => {
        supabase.auth.getUser().then((res) => {
            setAdminUser(res.data.user);
        });
    }, []);

    // FETCH ALL TOPICS
    const {
        data: topics = [],
        refetch: refetchTopics,
    } = useQuery({
        queryKey: ["topics"],
        queryFn: async () => {
            const { data } = await supabase
                .from("topics")
                .select("*")
                .order("created_at", { ascending: false });
            return data || [];
        },
    });


    // FETCH MESSAGES FOR SELECTED TOPIC
    const {
        data: messages = [],
        refetch: refetchMessages
    } = useQuery({
        queryKey: ["topic_messages", selectedTopic?.id],
        queryFn: async () => {
            if (!selectedTopic) return [];

            const { data } = await supabase
                .from("topic_messages")
                .select("*")
                .eq("topic_id", selectedTopic.id)
                .order("created_at", { ascending: true });

            return data || [];
        },
        enabled: !!selectedTopic,
    });


    // AUTO REFETCH EVERY 5 SECONDS (POLLING)
    useEffect(() => {
        if (!selectedTopic?.id) return;

        const interval = setInterval(() => {
            refetchMessages();
            refetchTopics()
        }, 5000); // 5 sec polling

        return () => clearInterval(interval);
    }, [selectedTopic?.id]);


    // SEND ADMIN MESSAGE
    const sendAdminMessage = async () => {
        if (!message.trim() || !selectedTopic) return;

        await supabase.from("topic_messages").insert([
            {
                topic_id: selectedTopic.id,
                message: message.trim(),
                sender_type: "admin",
                user_id: adminUser?.id,
                user_name: ADMIN_NAME,
                user_avatar: ADMIN_AVATAR,
            }
        ]);

        setMessage("");
        // ⭐ DIRECT REFRESH — NO DELAY
        await refetchMessages();
    };


    const deleteMessage = async (id: string) => {
        const { error } = await supabase
            .from("topic_messages")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            alert("Failed to delete message!");
            return;
        }

        await refetchMessages();
    };

    const deleteTopic = async (id: string) => {
        const { error } = await supabase
            .from("topics")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Delete topic error:");
            alert("Failed to delete topic!");
            return;
        }

        toast.success("Topic deleted successfully")

        // Refresh topics immediately
        await refetchTopics();
        closeDeleteModal();

        // If the deleted topic was selected → clear selection
        if (selectedTopic?.id === id) {
            setSelectedTopic(null);
        }
    };

    return (
        <Paper sx={{ display: { md: "flex", sm: "flex", xs: 'block' }, height: "85vh", overflow: "hidden" }}>

            {/* LEFT SIDE – TOPICS LIST */}
            <Box sx={{ width: { md: "25%", sm: "35%", xs: '100%' }, bgcolor: COLORS.black, color: COLORS.white, p: 2 }}>
                <Typography sx={{ fontSize: { md: 24, sm: 18, xs: 'auto' }, fontWeight: "bold", color: COLORS.primary }}>My Community Hub</Typography>
                <Divider sx={{ my: 2, borderColor: "#444" }} />
                <Typography sx={{ mt: 1, fontSize: 18, fontWeight: "bold", color: COLORS.seconday }}>
                    Topics
                </Typography>

                <Box sx={{ mt: 2 }}>
                    {topics.map((topic: any) => (
                        <Box
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 2,
                                mb: 1,
                                bgcolor: selectedTopic?.id === topic.id ? COLORS.seconday : COLORS.gray,
                                borderRadius: 2,
                                cursor: "pointer",
                            }}
                        >
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Avatar src={topic.image_base64} />
                                <Typography>{topic.post_title}</Typography>
                            </Box>

                            <IconButton
                                sx={{ bgcolor: "red", color: "white" }}
                                onClick={openDeleteModal}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                            {
                                isDeleteModal && (
                                    <ConfirmModal
                                        open={isDeleteModal}
                                        onCloseModal={closeDeleteModal}
                                        title="Are you sure you want to delete this topic?"
                                        btnText="Delete"
                                        onClick={() => deleteTopic(topic.id)}
                                        icon={<Delete fontSize="large" />}
                                    />
                                )
                            }
                        </Box>
                    ))}
                </Box>

            </Box>

            {/* RIGHT SIDE – CHAT PANEL */}
            <Box sx={{ width: { md: "75%", sm: "75%", xs: '100%' }, display: "flex", flexDirection: "column" }}>
                <Box sx={{ p: 2, borderBottom: "1px solid #ddd", display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box
                        component='img'
                        src={`${selectedTopic ? selectedTopic.image_base64 : "/assets/icons/DIYP.svg"}`}
                        sx={{ width: 40, heigth: 40, objectFit: 'cover', borderRadius: 50 }}
                    />
                    <Typography sx={{ fontSize: { md: 22, sm: 18, xs: 'auto' }, fontWeight: "bold" }}>
                        {selectedTopic ? selectedTopic.post_title : "Select a topic to start"}
                    </Typography>
                </Box>


                {/* Messages Area */}
                <Box
                    sx={{
                        flex: 1,
                        p: 2,
                        overflowY: "auto",
                        bgcolor: "#f5f5f5"
                    }}
                >
                    <Box sx={{ p: 2, width: { md: "50%", sm: "50%", xs: '100%' }, mb: 2 }}>
                        {selectedTopic && (
                            <Box
                                sx={{
                                    bgcolor: COLORS.seconday,
                                    p: 2,
                                    borderRadius: 3,
                                    boxShadow: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                }}
                            >
                                {/* Title */}
                                <Typography sx={{ fontWeight: 700, fontSize: 20, color: COLORS.black }}>
                                    {selectedTopic.post_title}
                                </Typography>

                                {/* Image */}
                                <Box
                                    component="img"
                                    src={selectedTopic.image_base64}
                                    alt="Topic"
                                    sx={{
                                        width: "100%",
                                        maxHeight: 250,
                                        objectFit: "contain",
                                        borderRadius: 2,
                                    }}
                                />

                                {/* Admin Thought */}
                                <Typography sx={{ fontSize: 15, opacity: 0.8, color: COLORS.white }}>
                                    {selectedTopic.admin_thought}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {messages.map((msg: any) => {
                        const fromAdmin = msg.sender_type === "admin";

                        return (
                            <Box
                                key={msg.id}
                                sx={{
                                    display: "flex",
                                    justifyContent: fromAdmin ? "flex-end" : "flex-start",
                                    gap: 1,
                                    mb: 2,
                                    alignItems: "flex-end",
                                    position: "relative",
                                    "&:hover .delete-btn": {
                                        opacity: 1,
                                        pointerEvents: "auto"
                                    }
                                }}
                            >
                                {/* LEFT AVATAR */}
                                {!fromAdmin && (
                                    <Avatar src={msg.user_avatar} sx={{ width: 32, height: 32 }} />
                                )}

                                {/* MESSAGE BUBBLE */}
                                <Box
                                    sx={{
                                        bgcolor: fromAdmin ? COLORS.seconday : COLORS.green,
                                        color: COLORS.white,
                                        p: 1.5,
                                        borderRadius: 2,
                                        boxShadow: 1,
                                        maxWidth: "65%",
                                        position: "relative"
                                    }}
                                >
                                    <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
                                        {msg.user_name}
                                    </Typography>
                                    <Typography sx={{ fontSize: 15 }}>{msg.message}</Typography>
                                    {/* DELETE ICON (only admin can delete) */}
                                    <IconButton
                                        className="delete-btn"
                                        onClick={() => deleteMessage(msg.id)}
                                        sx={{
                                            position: "absolute",
                                            top: -10,
                                            left: 0,
                                            bgcolor: "red",
                                            border: "1px solid red",
                                            color: "white",
                                            width: 20,
                                            height: 20,
                                            opacity: 0,
                                            transition: "0.2s",
                                            pointerEvents: "none",

                                            "&:hover": {
                                                bgcolor: "red",
                                                color: "white"
                                            }
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* RIGHT AVATAR (ADMIN) */}
                                {fromAdmin && (
                                    <Avatar
                                        src={ADMIN_AVATAR}
                                        sx={{ width: 32, height: 32, border: "1px solid orange" }}
                                    />
                                )}

                            </Box>
                        );
                    })}
                </Box>


                {/* Message Input */}
                {selectedTopic && (
                    <Box sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}>
                        <TextField
                            fullWidth
                            placeholder="Admin: Type a message..."
                            value={message}
                            multiline
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendAdminMessage();
                                }
                            }}
                        />
                        <IconButton onClick={sendAdminMessage} sx={{ bgcolor: COLORS.black, color: COLORS.white }}>
                            <SendIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default AdminCommunityPanel;
