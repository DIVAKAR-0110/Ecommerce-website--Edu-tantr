import React, { useState } from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Paper,
  Box,
  Grid,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0078d7" },
    secondary: { main: "#005fa3" },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
  },
});

export default function VendorLogin() {
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState("");

  function generateCaptcha() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let captcha = "";
    for (let i = 0; i < 5; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    if (userInput !== captcha) {
      setError("Captcha incorrect ❌");
      setCaptcha(generateCaptcha());
      return;
    }

    if (!email || !password) {
      setError("Please fill all required fields!");
      return;
    }

    setError("Redirecting...");
    setTimeout(() => navigate("/vendor/dashboard"), 1500);
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{ height: "100vh" }}>
        <CssBaseline />
        {/* Left side background section */}
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1581091215367-59ab6b0931f5')",
            backgroundRepeat: "no-repeat",
            backgroundColor: (t) =>
              t.palette.mode === "light"
                ? t.palette.grey[50]
                : t.palette.grey[900],
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Main form side */}
        <Grid
          item
          xs={12}
          sm={8}
          md={5}
          component={Paper}
          elevation={6}
          square
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              maxWidth: 380,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Vendor Login
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 1, width: "100%" }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <Box
                sx={{
                  mt: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: "#f3f4f6",
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Captcha Verification
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ letterSpacing: "5px", fontWeight: 600 }}
                >
                  {captcha}
                </Typography>
                <TextField
                  fullWidth
                  margin="dense"
                  placeholder="Enter Captcha"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCaptcha(generateCaptcha())}
                  sx={{ mt: 1 }}
                >
                  Refresh
                </Button>
              </Box>

              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1 }}
              >
                Sign In
              </Button>
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2">
                    {"Create Account"}
                  </Link>
                </Grid>
              </Grid>
              {error && (
                <Typography
                  sx={{ textAlign: "center", color: "red", mt: 2 }}
                  variant="body2"
                >
                  {error}
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}