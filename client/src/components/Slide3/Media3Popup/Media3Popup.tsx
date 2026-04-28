// Media3Popup.tsx
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
import { useSlide3 } from "../../../context/Slide3Context";
import { handleAutoDeletedAudio } from "../../../lib/lib";

interface Media3PopupProps {
  onClose: () => void;
  mediaType: "video" | "audio";
  activeIndex?: number;
}

const Media3Popup = ({ onClose, mediaType }: Media3PopupProps) => {
  const isVideo = mediaType === "video";
  const { user } = useAuth();
  const {
    audio3,
    setAudio3,
    selectedAudioUrl3,
    setSelectedAudioUrl3,
    tips3,
    setTips3,
    upload3,
    setUpload3,
    duration3,
    setDuration3,
  } = useSlide3();

  const [loading, setLoading] = useState(false);
  const [userAudios, setUserAudios] = useState<{ id: string; url: string }[]>(
    []
  );
  const [isDeleteMedia, setIsDeleteMedia] = useState('')

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

      // Check file type
      if (!ext || !allowedExtensions.includes(ext)) {
        alert(`Error: ${file.name} is not a supported audio format.`);
        return false;
      }

      // Check file size (max 50MB)
      if (fileSizeMB > 50) {
        alert(`Error: ${file.name} is too large (max 50MB).`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = ""; // clear invalid input
      return;
    }

    // Set valid audio files
    setAudio3(validFiles);
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
      console.error("Error saving audio:", err);
    }
  };

  // Upload audio to Supabase
  const handleAudioUpload = async () => {
    if (!audio3 || audio3.length === 0) {
      toast.error("No audio selected");
      return;
    }

    setLoading(true);
    try {
      for (const file of audio3) {
        const audioId = generateId().toString();
        const fileExt = file.name.split(".").pop();
        const fileName = `${audioId}.${fileExt}`;
        const filePath = `audio/${fileName}`;

        // Upload audio file
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, {
            upsert: true,
            metadata: {
              user_id: user?.id,
              created_at: new Date().toISOString(),
            },
          });

        if (uploadError) {
          console.error("Upload error:", uploadError.message);
          continue;
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from("media")
          .getPublicUrl(filePath);

        // Save URL to DB
        await saveAudioUrlToDB(audioId, publicData.publicUrl);
        setSelectedAudioUrl3(publicData.publicUrl);

        // Schedule auto-delete (2 min for testing or 1 week in production)
        handleAutoDeletedAudio(
          user?.id,
          audioId,
          fileName,
          fetchUserAudios,
          7 * 24 * 60 * 60 * 1000,
          setIsDeleteMedia,
        );
      }

      toast.success("Audio uploaded successfully!");
      await fetchUserAudios();

      setAudio3(null);
      setDuration3(0);
      setUpload3(true);
    } catch (err) {
      console.error("Error uploading audio:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete from state
  const handleAudioDelete = () => {
    setAudio3(null);
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
      console.error("Error fetching audios:", error);
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
        width: { md: 300, sm: 300, xs: "95%" },
        height: { md: 600, sm: 600, xs: 450 },
        left: { md: "23%", sm: "0%", xs: 0 },
        overflow: "hidden",
      }}
    >
      {tips3 && (
        <>
          {/* <Box
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
          </Box> */}
          <Box p={2} height={'100%'}>
            <Typography
              sx={{
                fontSize: { md: "23px", sm: "23px", xs: '20px' },
                fontWeight: "bold",
                color: "#363636ff",
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
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 3 }}
            >
              <CustomButton
                title={`Add ${isVideo ? "Video" : "Audio"}`}
                width="100%"
                onClick={() => {
                  setTips3(false);
                  setUpload3(true);
                }}
              />
              <CustomButton
                title="Maybe Later"
                width="100%"
                variant="outlined"
                onClick={() => {
                  setTips3(false);
                  setUpload3(true);
                }}
              />
            </Box>
          </Box>
        </>
      )}

      {upload3 && (
        <Box>
          {!audio3 && (
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
                  border: "3px dashed #3a7bd5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  userSelect: "none",
                  pointerEvents: "none",
                  color: "#3a7bd5",
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
                  mt={3}
                  sx={{
                    height: { md: "400px", sm: "400px", xs: 150 },
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
                  {
                    isDeleteMedia ? <Typography
                      sx={{ fontSize: "14px", fontWeight: "bold", mb: 1, color: 'red', opacity: 0.5 }}
                    >Your videos are deleted after one week</Typography> : <Box sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>
                        Your Uploaded Audios:
                      </Typography>
                      <Box component="hr" sx={{ border: 0, borderTop: "1px solid #e0e0e0", my: 1 }} />
                      <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                        Double tap your video to load your qr code onto your card
                      </Typography>
                    </Box>
                  }
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
                        onClick={() => setSelectedAudioUrl3(a.url)}
                        sx={{
                          position: "relative",
                          border:
                            selectedAudioUrl3 === a.url
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
                          opacity: selectedAudioUrl3 === a.url ? 1 : 0.8,
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
                          style={{ width: "100%", height: "30px" }}
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

          {audio3 && (
            <Box
              sx={{
                width: "100%",
                position: "relative",
              }}
            >
              {isVideo ? (
                <video
                  src={URL.createObjectURL(audio3[0])}
                  controls
                  autoPlay={false}
                  onLoadedMetadata={(e) =>
                    setDuration3(e.currentTarget.duration)
                  }
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <audio
                  src={URL.createObjectURL(audio3[0])}
                  controls
                  onLoadedMetadata={(e) =>
                    setDuration3(e.currentTarget.duration)
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
                  bgcolor: "#f0f1f3",
                  "&:hover": { bgcolor: "#f0f1f3", color: "#fd1ecdff" },
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
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <InfoOutline /> {(audio3[0].size / (1024 * 1024)).toFixed(0)}{" "}
                  MB
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <PlayCircleOutline /> {Math.floor(duration3 ?? 0)}s
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  mt: 1,
                  borderTop: "1px solid #d3d3d3ff",
                  borderBottom: "1px solid #d3d3d3ff",
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
                      color: "#3a7bd5",
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

export default Media3Popup;
