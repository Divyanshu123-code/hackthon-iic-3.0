# 🚀 Deploying Kisan Mandi on Render

This project is configured for seamless deployment on [Render](https://render.com/) as a **Unified Full-Stack Web Service** (React Frontend + Express Backend + Real-time SSE Stream).

---

## ⚡ Method 1: Instant Blueprint Deployment (Recommended)

Render can automatically read the [`render.yaml`](file:///Users/divanshu/iic%203./render.yaml) file in your repository:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure project for Render deployment"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and configure the Web Service with:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, provide your AI API key:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API Key)*
   - *(Optional)* `GROQ_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY`
7. Click **Apply**. Render will build the React frontend, set up the backend, and deploy your live URL!

---

## 🛠️ Method 2: Manual Web Service Deployment

If you prefer setting up manually on Render:

1. Go to [Render Dashboard](https://dashboard.render.com/) > **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `kisan-mandi`
   - **Language / Runtime**: `Node`
   - **Region**: Choose closest to you (e.g., *Singapore / Oregon / Frankfurt*)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty / blank)*
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`

4. Add **Environment Variables**:
   | Variable | Recommended Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `PORT` | `10000` | Render default web port |
   | `GEMINI_API_KEY` | `AIzaSy...` | For AI voice & text Sathi queries |
   | `GROQ_API_KEY` | *(optional)* | Fallback ultra-fast AI provider |
   | `OPENAI_API_KEY` | *(optional)* | OpenAI fallback |

5. Click **Create Web Service**.

---

## 🌐 What Will Be Accessible Once Deployed

- **Farmer Mobile & Desktop App**: `https://<your-subdomain>.onrender.com/`
- **Staff Control Desk**: `https://<your-subdomain>.onrender.com/staff`
- **Live SSE Event Stream**: `https://<your-subdomain>.onrender.com/api/stream`
- **Health Check**: `https://<your-subdomain>.onrender.com/api/health`
