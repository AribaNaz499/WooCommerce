// Media4Popup.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../supabase/supabase";
import toast from "react-hot-toast";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { Box, IconButton, List, ListItem, Typography } from "@mui/material";
import CustomButton from "../../CustomButton/CustomButton";
import {
  ControlPoint,
  Delete,
  InfoOutline,
  PlayCircleOutline,
} from "@mui/icons-material";
import { COLORS } from "../../../constant/color";
import { useSlide4 } from "../../../context/Slide4Context";

interface Media4PopupProps {
  onClose: () => void;
  mediaType: "video" | "audio";
  activeIndex?: number;
}

const Media4Popup = ({ onClose, mediaType }: Media4PopupProps) => {
  const isVideo = mediaType === "video";
  const { user } = useAuth();
  const {
    audio4,
    setAudio4,
    selectedAudioUrl4,
    setSelectedAudioUrl4,
    tips4,
    setTips4,
    upload4,
    setUpload4,
    duration4,
    setDuration4,
  } = useSlide4();

  const [loading, setLoading] = useState(false);
  const [userAudios, setUserAudios] = useState<{ id: string; url: string }[]>(
    []
  );

  const generateId = () => Date.now() + Math.random();

  // Handle audio file selection
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Allowed extensions
    const allowedExtensions = ["mp3", "wav", "aiff", "aac", "m4a"];

    const validFiles = Array.from(files).filter((file) => {
      const fileSizeMB = file.size / (1024 * 1024);
      const ext = file.name.split(".").pop()?.toLowerCase();

      // ✅ Check file type
      if (!ext || !allowedExtensions.includes(ext)) {
        alert(`❌ ${file.name} is not a supported audio format.`);
        return false;
      }

      // ✅ Check file size (max 50MB)
      if (fileSizeMB > 50) {
        alert(`❌ ${file.name} is too large (max 50MB).`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = ""; // clear invalid input
      return;
    }

    // ✅ Set valid audio files
    setAudio4(validFiles);
  };

  // Save audio URL to DB
  const saveAudioUrlToDB = async (audioId: string, audioUrl: string) => {
    if (!user?.id) return;

    try {
      const { data: userData } = await supabase
        .from("Users")
        .select("audio")
        .eq("auth_id", user.id)
        .single();

      const newAudio = { id: audioId, url: audioUrl };
      const updatedAudios = userData?.audio
        ? [...userData.audio, newAudio]
        : [newAudio];

      const { error } = await supabase
        .from("Users")
        .update({ audio: updatedAudios })
        .eq("auth_id", user.id);

      if (error) throw error;
    } catch (err) {
      console.error("❌ Error saving audio:", err);
    }
  };

  // Upload audio to Supabase
  const handleAudioUpload = async () => {
    if (!audio4 || audio4.length === 0) {
      toast.error("No audio selected");
      return;
    }

    setLoading(true);
    try {
      for (const file of audio4) {
        const audioId = generateId().toString();
        const fileExt = file.name.split(".").pop();
        const fileName = `${audioId}.${fileExt}`;
        const filePath = `audio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        await saveAudioUrlToDB(audioId, publicData.publicUrl);
        setSelectedAudioUrl4(publicData.publicUrl);
      }

      toast.success("Audio uploaded successfully!");
      setAudio4(null);
      setDuration4(0);
      setUpload4(true);
      await fetchUserAudios();
    } catch (err) {
      console.error("Error uploading audio:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete from state
  const handleAudioDelete = () => {
    setAudio4(null);
  };

  // Fetch user's uploaded audios
  const fetchUserAudios = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("Users")
      .select("audio")
      .eq("auth_id", user.id)
      .single();

    if (error) {
      console.error("❌ Error fetching audios:", error);
      return;
    }

    setUserAudios(data?.audio || []);
  };

  console.log(userAudios, "--");

  // Delete audio from DB + storage
  const handleDeleteAudio = async (audioId: string) => {
    if (!user?.id) return;

    const { data: userData }: any = await supabase
      .from("Users")
      .select("audio")
      .eq("auth_id", user.id)
      .single();

    const audioToDelete = userData?.audio.find((a: any) => a.id === audioId);
    if (!audioToDelete) return;

    const fileName = audioToDelete.url.split("/").pop();
    const { error: storageError } = await supabase.storage
      .from("media")
      .remove([`audio/${fileName}`]);

    if (storageError) {
      console.error("Error deleting audio from storage:", storageError);
      return;
    }

    const updatedAudios = userData.audio.filter((a: any) => a.id !== audioId);
    const { error: updateError } = await supabase
      .from("Users")
      .update({ audio: updatedAudios })
      .eq("auth_id", user.id);

    if (!updateError) {
      setUserAudios(updatedAudios);
      toast.success("Audio deleted successfully!");
    }
  };

  useEffect(() => {
    if (user) fetchUserAudios();
  }, [user]);

  return (
    <PopupWrapper
      title={isVideo ? "Video" : "Audio"}
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 280, xs: "95%" },
        height: {md:600,sm:600,xs:480},
        left: { md: "58%", sm: "0%", xs: 0 },
        mt: { md: 0, sm: 0, xs: 0 },
        overflow: "hidden",
      }}
    >
      {tips4 && (
        <>
          <Box
            sx={{
              height: 200,
              width: "100%",
              bgcolor: "gray",
              position: "relative",
              display: { md: 'flex', sm: 'flex', xs: 'none' }
            }}
          >
            <video
              src={"/assets/images/diy-tips.mp4"}
              autoPlay
              loop
              muted
              style={{ width: "100%", height: "100%" }}
            />
          </Box>
          <Box p={2}>
            <Typography
              sx={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#464646ff",
                textAlign: "center",
              }}
            >
              Add a Free {isVideo ? "Video" : "Audio"} Message!
            </Typography>
            <List
              component="ol"
              sx={{
                listStyleType: "decimal",
                fontSize: "14px",
                color: "#444444ff",
                pl: 2,
                "& .MuiListItem-root": {
                  display: "list-item",
                  padding: "4px",
                  margin: 0,
                },
              }}
            >
              <ListItem>
                You upload a {isVideo ? "Video" : "Audio"} recording
              </ListItem>
              <ListItem>We print a QR in the card</ListItem>
              <ListItem>They scan it to play the message</ListItem>
            </List>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 4 }}
            >
              <CustomButton
                title={`Add ${isVideo ? "Video" : "Audio"}`}
                width="100%"
                onClick={() => {
                  setTips4(false);
                  setUpload4(true);
                }}
              />
              <CustomButton
                title="Maybe Later"
                width="100%"
                variant="outlined"
                onClick={() => {
                  setTips4(false);
                  setUpload4(true);
                }}
              />
            </Box>
          </Box>
        </>
      )}

      {upload4 && (
        <Box>
          {!audio4 && (
            <>
              <Box
                component="input"
                type="file"
                accept=".mp3, .wav, .aiff, audio/mpeg, audio/wav, audio/aiff"
                sx={{
                  position: "absolute",
                  width: "260px",
                  height: "110px",
                  opacity: 0,
                  cursor: "pointer",
                  left: 20,
                  zIndex: 10,
                }}
                onChange={handleAudioFileChange}
                multiple
              />
              <Box
                sx={{
                  width: "100%",
                  height: "100px",
                  borderRadius: "8px",
                  border: "4px dashed #4a7bd5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  userSelect: "none",
                  pointerEvents: "none",
                  color: "#4a7bd5",
                  fontWeight: "bold",
                  flexDirection: "column",
                  fontSize: "20px",
                }}
              >
                <ControlPoint fontSize="large" />
                Add {isVideo ? "Video" : "Audio"}
              </Box>

              {userAudios.length > 0 && (
                <Box
                  mt={4}
                  sx={{
                    height: "400px",
                    overflowY: "auto",
                    p: 1,
                    "&::-webkit-scrollbar": {
                      height: "6px",
                      width: "5px",
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "#f1f1f1",
                      borderRadius: "20px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: COLORS.primary,
                      borderRadius: "20px",
                    },
                  }}
                >
                  <Typography
                    sx={{ fontSize: "16px", fontWeight: "bold", mb: 1 }}
                  >
                    Your Uploaded Audios:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    {userAudios.map((a) => (
                      <Box
                        key={a.id}
                        onClick={() => setSelectedAudioUrl4(a.url)}
                        sx={{
                          position: "relative",
                          border:
                            selectedAudioUrl4 === a.url
                              ? "3px solid #3a7bd5"
                              : "1px solid #ccc",
                          borderRadius: 2,
                          overflow: "hidden",
                          width: "100%",
                          height: 80,
                          display: "flex",
                          alignItems: "center",
                          flexDirection: "column",
                          justifyContent: "center",
                          m: "auto",
                          cursor: "pointer",
                          opacity: selectedAudioUrl4 === a.url ? 1 : 0.8,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            borderColor: "#3a7bd5",
                            opacity: 1,
                          },
                        }}
                      >
                        <audio
                          src={a.url}
                          controls
                          style={{ width: "100%", height: "40px" }}
                        />
                        <IconButton
                          onClick={() => handleDeleteAudio(a.id)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "#c9c9c9ff",
                            "&:hover": { bgcolor: "#c09f9fff", color: "red" },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}

          {audio4 && (
            <Box
              sx={{
                width: "100%",
                height: isVideo ? 200 : "auto",
                position: "relative",
              }}
            >
              {isVideo ? (
                <video
                  src={URL.createObjectURL(audio4[0])}
                  controls
                  autoPlay={false}
                  onLoadedMetadata={(e) =>
                    setDuration4(e.currentTarget.duration)
                  }
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <audio
                  src={URL.createObjectURL(audio4[0])}
                  controls
                  onLoadedMetadata={(e) =>
                    setDuration4(e.currentTarget.duration)
                  }
                  style={{ width: "100%" }}
                />
              )}

              <IconButton
                onClick={handleAudioDelete}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "#f0f1f4",
                  "&:hover": { bgcolor: "#f0f1f4", color: "#fd1ecdff" },
                  zIndex: 99,
                }}
                size="small"
                aria-label={`Delete uploaded ${isVideo ? "video" : "audio"}`}
              >
                <Delete />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  mt: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <InfoOutline /> {(audio4[0].size / (1024 * 1024)).toFixed(0)}{" "}
                  MB
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <PlayCircleOutline /> {Math.floor(duration4 ?? 0)}s
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 4,
                  mt: 1,
                  borderTop: "1px solid #d4d4d4ff",
                  borderBottom: "1px solid #d4d4d4ff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: 80, height: 80, cursor: "pointer" }}
                />
                <Typography sx={{ fontSize: "15px", color: "#929292ff" }}>
                  I confirm this {isVideo ? "video" : "audio"} does not violate
                  DIY Personalisation content rule as outlined in{" "}
                  <Box
                    component="a"
                    href="#"
                    sx={{
                      textDecoration: "none",
                      color: "#4a7bd5",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    IDEA term and condition
                  </Box>
                </Typography>
              </Box>
              <br />
              <CustomButton
                title={`Upload ${isVideo ? "Video" : "Audio"}`}
                width="90%"
                loading={loading}
                onClick={isVideo ? undefined : handleAudioUpload}
              />
            </Box>
          )}
        </Box>
      )}
    </PopupWrapper>
  );
};

export default Media4Popup;
