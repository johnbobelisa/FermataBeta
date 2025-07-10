import cv2
import frontend.FermataBeta.src.v1 as mp
import numpy as np

class HoldDetector:
    def __init__(self):
        # Use newer MediaPipe API for object detection
        # Since Objectron is deprecated, we'll use a color-based approach
        # which works better for climbing holds anyway
        self.setup_color_detection()
        
    def setup_color_detection(self):
        """Setup color-based hold detection"""
        # Define HSV color ranges for common hold colors
        self.color_ranges = {
            'yellow': ([20, 100, 100], [30, 255, 255]),
            'red': ([0, 100, 100], [10, 255, 255]),
            'blue': ([100, 100, 100], [120, 255, 255]),
            'green': ([40, 100, 100], [80, 255, 255]),
            'purple': ([130, 100, 100], [160, 255, 255]),
            'orange': ([10, 100, 100], [20, 255, 255]),
            'pink': ([160, 100, 100], [180, 255, 255])
        }
        
    def detect_holds(self, image):
        """Detect holds using color-based approach"""
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Apply Gaussian blur to reduce noise
        hsv = cv2.GaussianBlur(hsv, (5, 5), 0)
        
        holds = []
        
        for color_name, (lower, upper) in self.color_ranges.items():
            # Create mask for this color
            mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
            
            # Apply morphological operations to clean up the mask
            kernel = np.ones((5, 5), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                # Filter by area (adjust these values based on your image size)
                if 200 < area < 8000:
                    # Calculate shape properties
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        
                        # Filter by circularity (holds tend to be somewhat circular)
                        if circularity > 0.3:
                            # Get bounding box and center
                            x, y, w, h = cv2.boundingRect(contour)
                            center_x = x + w // 2
                            center_y = y + h // 2
                            
                            # Calculate confidence based on area and circularity
                            confidence = min(0.99, (area / 1000) * circularity)
                            
                            holds.append({
                                'center': (center_x / image.shape[1], center_y / image.shape[0]),  # Normalized
                                'center_px': (center_x, center_y),  # Pixel coordinates
                                'confidence': confidence,
                                'color': color_name,
                                'area': area,
                                'bbox': (x, y, w, h)
                            })
        
        # Remove duplicate detections (same area detected in multiple colors)
        holds = self.remove_duplicates(holds)
        
        return holds
    
    def remove_duplicates(self, holds):
        """Remove duplicate hold detections"""
        if not holds:
            return holds
            
        # Sort by confidence
        holds.sort(key=lambda x: x['confidence'], reverse=True)
        
        filtered_holds = []
        for hold in holds:
            is_duplicate = False
            center_px = hold['center_px']
            
            for existing_hold in filtered_holds:
                existing_center = existing_hold['center_px']
                distance = np.sqrt((center_px[0] - existing_center[0])**2 + 
                                 (center_px[1] - existing_center[1])**2)
                
                # If centers are too close, consider it a duplicate
                if distance < 30:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered_holds.append(hold)
                
        return filtered_holds
    
    def draw_holds(self, image, holds):
        """Draw detected holds on the image"""
        height, width = image.shape[:2]
        
        # Color mapping for visualization
        color_map = {
            'yellow': (0, 255, 255),
            'red': (0, 0, 255),
            'blue': (255, 0, 0),
            'green': (0, 255, 0),
            'purple': (255, 0, 255),
            'orange': (0, 165, 255),
            'pink': (203, 192, 255)
        }
        
        for i, hold in enumerate(holds):
            center_px = hold['center_px']
            color = hold['color']
            confidence = hold['confidence']
            
            # Get visualization color
            viz_color = color_map.get(color, (255, 255, 255))
            
            # Draw circle for hold
            cv2.circle(image, center_px, 15, viz_color, 3)
            
            # Draw hold number
            cv2.putText(image, str(i + 1), 
                       (center_px[0] - 10, center_px[1] + 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, viz_color, 2)
            
            # Draw color and confidence
            text = f"{color} {confidence:.2f}"
            cv2.putText(image, text, 
                       (center_px[0] - 30, center_px[1] - 25),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, viz_color, 1)
        
        return image
    
    def process_uploaded_image(self, image_path):
        """Process a single uploaded image"""
        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            print(f"Error: Could not load image from {image_path}")
            return None, []
        
        print(f"Processing image: {image_path}")
        print(f"Image size: {image.shape}")
        
        # Detect holds
        holds = self.detect_holds(image)
        
        # Draw results
        output_image = self.draw_holds(image.copy(), holds)
        
        return output_image, holds
    
    def save_result(self, output_image, output_path):
        """Save the processed image"""
        cv2.imwrite(output_path, output_image)
        print(f"Result saved to: {output_path}")

def main():
    detector = HoldDetector()
    
    # Process uploaded image
    image_path = "frontend/FermataBeta/src/images/2.jpg"
    
    result_image, holds = detector.process_uploaded_image(image_path)
    
    if result_image is not None:
        print(f"Detected {len(holds)} potential holds")
        
        # Print hold details
        for i, hold in enumerate(holds):
            print(f"Hold {i+1}: Color={hold['color']}, Confidence={hold['confidence']:.2f}, Area={hold['area']}")
        
        # Display the result
        cv2.imshow('Hold Detection Result', result_image)
        
        # Save the result
        output_path = image_path.rsplit('.', 1)[0] + '_detected.' + image_path.rsplit('.', 1)[1]
        detector.save_result(result_image, output_path)
        
        print("Press any key to close the image window...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    # Optional webcam mode
    use_webcam = input("Do you want to use webcam mode? (y/n): ").lower() == 'y'
    
    if use_webcam:
        cap = cv2.VideoCapture(0)
        print("Press 'q' to quit webcam mode")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            holds = detector.detect_holds(frame)
            output_frame = detector.draw_holds(frame, holds)
            
            # Display hold count
            cv2.putText(output_frame, f"Holds detected: {len(holds)}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.imshow('Live Hold Detection', output_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()