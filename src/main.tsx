
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Add viewport meta tag for mobile optimization
const viewport = document.querySelector('meta[name="viewport"]');
if (viewport) {
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
}

createRoot(document.getElementById("root")!).render(<App />);
