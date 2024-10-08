# Wave Animation Project Summary

## Key Files:

1. src/App.tsx
   - Main component with wave animation, audio upload, and SRT subtitle functionality
   - Contains the canvas drawing logic and state management

2. src/index.css
   - Tailwind CSS imports and global styles

3. package.json
   - Project dependencies and scripts

4. tailwind.config.js
   - Tailwind CSS configuration

5. postcss.config.js
   - PostCSS configuration for Tailwind

6. vite.config.ts
   - Vite configuration

## Installation:

1. Create a new Vite project:
   ```
   npm create vite@latest wave-animation -- --template react-ts
   ```

2. Navigate to the project directory:
   ```
   cd wave-animation
   ```

3. Install dependencies:
   ```
   npm install lucide-react
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. Replace the contents of the files mentioned above with the provided code.

5. Run the development server:
   ```
   npm run dev
   ```

## Key Features:

- Dynamic wave animation using HTML5 Canvas
- Audio file upload and playback
- SRT subtitle file upload and display
- Responsive design with Tailwind CSS
- Play/Pause functionality for audio
- Audio visualization integrated with wave animation

Remember to copy the full content of each file from the previous messages to ensure all functionality is included.