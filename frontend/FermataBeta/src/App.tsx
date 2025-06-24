// React Component: App
// React components return JSX, which React will turn into HTML and inject into #root

// THIS IS THE HOME PAGE OF FermataBeta
import { useState, useRef, useEffect } from 'react'
import Navbar from './components/Navbar'
import { jsPDF } from "jspdf";

function App() {
  // State to store the loaded image object
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  
  // State to store the original image data URL (without markers)
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null)
  
  // State to store hold coordinates
  const [holds, setHolds] = useState<{x: number, y: number}[]>([])
  
  // State for beta generation
  const [loading, setLoading] = useState(false)
  const [slides, setSlides] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Reference to the canvas element so we can draw on it
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // useEffect that runs whenever image changes and only when canvas ref is ready
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match the actual image dimensions
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Clear any previous content and draw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    
    // Store the original image data URL (without markers)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setOriginalDataUrl(dataUrl);
    
    console.log('Canvas setup complete via useEffect');
  }, [image]); // run whenever image changes

  // function that runs when user selects a file
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Check if files exist and get the first file from the input
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset holds and slides when new image is uploaded
    setHolds([]);
    setSlides([]);
    setCurrentSlide(0);
    setImage(null); // Clear previous image
    setOriginalDataUrl(null); // Clear previous data URL
    

    // Create a new Image object
    const img = new Image();
    
    // Add error handler
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      alert('Failed to load the selected image. Please try a different image.');
    };
    
    // onload - set the image, let useEffect handle the drawing
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      setImage(img); // Let the useEffect handle canvas drawing
      URL.revokeObjectURL(img.src); // Free the object URL to prevent memory leaks
    };
    
    // Setting img.src triggers the browser to start loading the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Reset the input value so the same file can be selected again
    event.target.value = '';
    
    console.log('Started loading image from:', objectUrl);
  }

  // Function to handle clicks on the canvas for tagging holds
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return; // if no image loaded, do nothing
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position in canvas coordinates
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates to match canvas internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // Add the hold to state
    const newHold = { x: Math.round(canvasX), y: Math.round(canvasY) };
    setHolds(prev => [...prev, newHold]);
    
    // Draw the marker on the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 10, 0, 2 * Math.PI); // draw a circle of radius 10
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke(); // outline in white for visibility
    
    // Draw the hold number
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(holds.length + 1), canvasX, canvasY + 5);
  }

  // Function to clear all holds
  const clearHolds = () => {
    setHolds([]);
    // Redraw the original image without markers
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && image.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
      }
    }
  }

  // Function to generate beta
  const handleGenerateBeta = async () => {
    if (!originalDataUrl || holds.length === 0) {
      alert("davidkim");
      return;
    }
    
    setLoading(true);
    try {
      // const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5173';
      const BACKEND_URL = 'http://localhost:5173';
      
      const response = await fetch(`${BACKEND_URL}/generate-beta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: originalDataUrl,
          holds: holds
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      // Assume result has shape: { images: [ "data:image/png;base64,...", ... ] }
      setSlides(result.images || []);
      setCurrentSlide(0);
    } catch (err) {
      console.error("Error generating beta:", err);
      alert("Failed to generate beta. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPDF = () => {
    if (slides.length === 0 || !image) return;

    const pdf = new jsPDF({
      orientation: image.width > image.height ? "landscape" : "portrait",
      unit: "px",
      format: [image.width, image.height],
    });

    slides.forEach((imgData, idx) => {
      if (idx !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, image.width, image.height);
    });

    pdf.save("boulder-beta.pdf");
  };


  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main content area */}
      <div className="pt-20 px-6 pb-8">
        <div className="max-w-4xl mx-auto">

          {/* Header section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Boulder Beta</h1>
            <p className="text-lg text-gray-600">Upload and get beta in mere seconds!</p>
          </div>
          
          {/* Upload section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
                  </svg>
                </div>
                <div>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      Choose an image file
                    </span>
                    <input 
                      id="image-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Canvas section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {image ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Your Route Image</h2>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-600">
                      Holds tagged: {holds.length}
                    </span>
                    {holds.length > 0 && (
                      <button
                        onClick={clearHolds}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Clear Holds
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  <canvas 
                    ref={canvasRef} 
                    onClick={handleCanvasClick}
                    className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm cursor-crosshair"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Click on the image to tag holds in order. Each click will add a numbered marker.
                  </p>
                  <button
                    onClick={handleGenerateBeta}
                    disabled={loading || holds.length === 0}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      loading || holds.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Generating Beta...' : 'Generate Beta'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">No image uploaded yet</p>
                <p className="text-gray-400 text-sm mt-1">Select an image above to get started</p>
              </div>
            )}
          </div>

          {/* Beta Slideshow section */}
          {slides.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Generated Beta Slideshow
              </h2>

              <img
                src={slides[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                style={{ maxWidth: "100%", display: "block", margin: "0 auto 20px" }}
              />

              <div className="flex flex-wrap justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentSlide(i => Math.max(i - 1, 0))}
                  disabled={currentSlide === 0}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  ◀ Prev
                </button>

                <span className="text-sm mx-2">
                  Slide {currentSlide + 1} of {slides.length}
                </span>

                <button
                  onClick={() =>
                    setCurrentSlide(i => Math.min(i + 1, slides.length - 1))
                  }
                  disabled={currentSlide === slides.length - 1}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next ▶
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App