import { useState, useRef, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Divider,
    TextField,
    IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { COLORS } from "../../../../../constant/color";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../../supabase/supabase";
import { useAuth } from "../../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { USER_ROUTES } from "../../../../../constant/route";

const CommunityChat = () => {

    const [input, setInput] = useState("");
    const [selectedTopic, setSelectedTopic] = useState<any>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: userProfile } = useQuery({
        queryKey: ["user-profile", user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from("Users")
                .select("*")
                .eq("auth_id", user?.id)
                .single();

            return data;
        },
        enabled: !!user?.id
    });



    // ---------------- TOPICS ----------------
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


    // ---------------- MESSAGES ----------------
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


    // useEffect(() => {
    //     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [messages]);

    // AUTO REFETCH EVERY 5 SECONDS (POLLING)
    useEffect(() => {
        if (!selectedTopic?.id) return;

        const interval = setInterval(() => {
            refetchTopics()
            refetchMessages();
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedTopic?.id]);

    // ---------------- SEND USER MESSAGE ----------------
    const sendMessage = async () => {
        if (!input.trim() || !selectedTopic) {
            console.log("Missing input or topic");
            return;
        }

        if (!user) {
            toast.error("Please sign in to send a message.");
            navigate(USER_ROUTES.SIGNIN);
            return;
        }


        if (!userProfile) {
            console.log("User profile not found in Users table");
            return;
        }

        const payload = {
            topic_id: selectedTopic.id,
            message: input.trim(),
            sender_type: "user",
            user_id: user.id,
            user_name: userProfile.full_name,
            user_avatar: userProfile.user_metadata?.avatar_url

        };

        console.log("Payload:", payload);

        const { data, error } = await supabase.from("topic_messages").insert([payload]);

        if (error) {
            console.error("Supabase Insert Error:", error);
            alert("Insert failed: " + error.message);
            return;
        }

        console.log("Message inserted:", data);

        setInput("");
        // ⭐ DIRECT REFRESH — NO DELAY
        await refetchMessages();
    };


    return (
        <Paper
            elevation={10}
            sx={{
                width: "100%",
                height: "85vh",
                margin: "30px auto",
                borderRadius: 3,
                display: "flex",
                overflow: "hidden",
            }}
        >
            {/* ---------------- LEFT PANEL ---------------- */}
            <Box
                sx={{
                    width: "20%",
                    backgroundColor: COLORS.black,
                    display: "flex",
                    flexDirection: "column",
                    color: COLORS.white,
                    p: 3,
                }}
            >
                <Typography sx={{ fontSize: 26, fontWeight: 700 }}>
                    Community Hub
                </Typography>

                <Typography sx={{ mt: 1, fontSize: 16, opacity: 0.9 }}>
                    Public Chat Room
                </Typography>

                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.4)" }} />

                {/* TOPIC LIST */}
                <Box sx={{ mt: 3 }}>
                    <Typography
                        sx={{
                            fontSize: 18,
                            opacity: 0.8,
                            fontWeight: "bold",
                            color: COLORS.primary,
                        }}
                    >
                        🚩 Posts
                    </Typography>

                    <Box sx={{ mt: 3 }}>
                        {topics.map((topic: any) => (
                            <Box
                                key={topic.id}
                                onClick={() => setSelectedTopic(topic)}
                                sx={{
                                    p: 1,
                                    mb: 1,
                                    bgcolor: selectedTopic?.id === topic.id ? COLORS.seconday : COLORS.gray,
                                    borderRadius: 2,
                                    cursor: "pointer",
                                }}
                            >
                                <Typography>{topic.post_title}</Typography>
                            </Box>
                        ))}
                    </Box>

                </Box>

                {/* Stats */}
                <Box sx={{ mt: 3 }}>
                    <Typography sx={{ fontSize: 14, opacity: 0.8 }}>
                        🔹 Total messages: {messages.length}
                    </Typography>
                </Box>
            </Box>

            {/* ---------------- RIGHT CHAT AREA ---------------- */}
            <Box sx={{ width: "80%", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: "1px solid #ddd",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Avatar src="/assets/icons/DIYP.svg" />
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                        {selectedTopic ? selectedTopic.title : "Select a topic to begin"}
                    </Typography>
                </Box>

                {/* Messages */}
                <Box
                    sx={{
                        flex: 1,
                        p: 2,
                        overflowY: "auto",
                        backgroundColor: "#f7f7f7",
                    }}
                >
                    <Box sx={{ p: 2, width: "50%", mb: 2 }}>
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
                        const isUser = msg.sender_type === "user";
                        const isAdmin = msg.sender_type === "admin";

                        return (
                            <Box
                                key={msg.id}
                                sx={{
                                    display: "flex",
                                    justifyContent: isUser ? "flex-end" : "flex-start",
                                    gap: 1,
                                    mb: 2,
                                    alignItems: "flex-end",
                                }}
                            >
                                {/* LEFT Avatar (Admin or Other Users) */}
                                {!isUser && (
                                    <Avatar
                                        src={msg.user_avatar || "/assets/icons/admin.svg"}
                                        sx={{ width: 32, height: 32, border: '1px solid orange' }}
                                    />
                                )}

                                {/* Message bubble */}
                                <Box
                                    sx={{
                                        bgcolor: isAdmin ? COLORS.seconday : COLORS.green,
                                        color: COLORS.white,
                                        p: 1.5,
                                        borderRadius: 2,
                                        boxShadow: 1,
                                        maxWidth: "65%",
                                    }}
                                >
                                    <Typography sx={{ fontSize: 12, opacity: 0.8 }}>
                                        {msg.user_name}
                                    </Typography>

                                    <Typography sx={{ fontSize: 15 }}>
                                        {msg.message}
                                    </Typography>
                                </Box>

                                {/* RIGHT Avatar (Authenticated user) */}
                                {isUser && (
                                    <Avatar
                                        src={user?.user_metadata?.avatar_url || undefined}
                                        sx={{ width: 32, height: 32, border: '1px solid orange' }}
                                    />
                                )}
                            </Box>
                        );
                    })}

                    <div ref={scrollRef} />
                </Box>


                {/* Input Section */}
                {selectedTopic && (
                    <>
                        <Divider />
                        <Box
                            sx={{
                                p: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <TextField
                                fullWidth
                                placeholder="Type your thought..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                multiline
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();      // Prevent newline
                                        sendMessage();           // Send message
                                    }
                                }}
                                sx={{
                                    backgroundColor: COLORS.white,
                                    borderRadius: 50,
                                }}
                            />

                            <IconButton
                                onClick={sendMessage}
                                disabled={!input.trim()}
                                sx={{
                                    backgroundColor: COLORS.black,
                                    color: COLORS.white,
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        </Box>
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default CommunityChat;
