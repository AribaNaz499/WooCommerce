import React from "react";
import Router from "../Router/Router";
import theme from "../../style/theme";
import { AuthProvider, setAuthQueryClient } from "../../context/AuthContext";
import { CartProvider } from "../../context/AddToCart";
import { COLORS } from "../../constant/color";
import { AdminProvider } from "../../context/AdminContext";
import { Slide2Provider } from "../../context/Slide2Context";
import { Slide3Provider } from "../../context/Slide3Context";
import { Slide4Provider } from "../../context/Slide4Context";
import { AdminCardEditorProvider } from "../../context/AdminEditorContext";
import { Slide1Provider } from "../../context/Slide1Context";
import GlobalWatermark from "../../components/GlobalWatermark/GlobalWatermark";
import { CategoriesEditorProvider } from "../../context/CategoriesEditorContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { ThemeProvider } from "@emotion/react";
import { Toaster } from "react-hot-toast";
import { isSupabaseConfigured, supabaseConfigError } from "../../supabase/supabase";
import AuthRedirector from "../../components/AuthRedirector/AuthRedirector";
import { useQueryClient } from "@tanstack/react-query";
import DebugConsoleOverlay from "../../components/DebugConsoleOverlay/DebugConsoleOverlay";

const AuthQueryClientBridge = () => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setAuthQueryClient(queryClient);
  }, [queryClient]);

  return null;
};

const App = () => {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider theme={theme}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f5f1e8",
            padding: "24px",
            color: "#1f1a17",
          }}
        >
          <div
            style={{
              maxWidth: "720px",
              width: "100%",
              background: "#fffaf2",
              border: "1px solid #e8dcc8",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 60px rgba(66, 45, 14, 0.08)",
            }}
          >
            <h1 style={{ margin: "0 0 12px", fontSize: "32px" }}>Supabase Setup Required</h1>
            <p style={{ margin: "0 0 12px", lineHeight: 1.6 }}>
              The site is running, but Supabase environment variables are missing for this
              deployment.
            </p>
            <p style={{ margin: "0 0 16px", lineHeight: 1.6 }}>{supabaseConfigError}</p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in
              Vercel environment variables, then redeploy.
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <React.Fragment>
      <ThemeProvider theme={theme}>
        <AuthQueryClientBridge />
        <DebugConsoleOverlay />
        <AuthProvider>
          <AuthRedirector />
          <CartProvider>
            {/* Fist Slide */}
            <Slide1Provider>
              {/* Second Slide */}
              <Slide2Provider>
                {/* Third Slide */}
                <Slide3Provider>
                  {/* Fourth Slide  */}
                  <Slide4Provider>
                    <AdminProvider>
                      <NotificationProvider>
                        <AdminCardEditorProvider>
                          <CategoriesEditorProvider>
                            <Router />
                          </CategoriesEditorProvider>
                        </AdminCardEditorProvider>
                      </NotificationProvider>
                    </AdminProvider>
                  </Slide4Provider>
                </Slide3Provider>
              </Slide2Provider>
            </Slide1Provider>

            {/* Global water mark */}
            <GlobalWatermark />

            <Toaster
              position="bottom-right"
              reverseOrder={false}
              toastOptions={{
                // global styles
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                  width: "300px",
                  minHeight: "60px",
                  padding: "12px",
                  fontSize: "16px",
                },

                // success specific
                success: {
                  style: {
                    background: "#ecececff",
                    color: COLORS.black,
                  },
                },

                // error specific
                error: {
                  style: {
                    background: "#9c1006ff",
                    color: COLORS.white,
                  },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </React.Fragment>
  );
};

export default App;
