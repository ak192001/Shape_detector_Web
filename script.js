const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        processVideo();
    })
    .catch(err => {
        console.error('Error accessing camera:', err);
    });

    function processVideo() {
        requestAnimationFrame(processVideo);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const mat = cv.matFromImageData(imageData);
    
        // Convert to grayscale
        const gray = new cv.Mat();
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
    
        // Apply Gaussian blur to reduce noise
        const blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0);
    
        // Apply adaptive thresholding
        const threshold = new cv.Mat();
        cv.threshold(blurred, threshold, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(threshold, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
    
        let isTriangle = false;
        for (let i = 0; i < contours.size(); ++i) {
            const cnt = contours.get(i);
            const approx = new cv.Mat();
            cv.approxPolyDP(cnt, approx, 0.02 * cv.arcLength(cnt, true), true);
    
            if (approx.data32S.length === 6) {
                const [x, y] = approx.data32S;
                cv.putText(mat, 'Triangle', new cv.Point(x, y), cv.FONT_HERSHEY_COMPLEX, 1, [0, 0, 0, 255]);
                isTriangle = true;
                break;
            }
        }
    
        if (!isTriangle) {
            cv.putText(mat, 'Not a Triangle', new cv.Point(10, 30), cv.FONT_HERSHEY_COMPLEX, 1, [0, 0, 0, 255]);
        }
    
        cv.imshow('canvas', mat);
    
        // Clean up
        mat.delete();
        gray.delete();
        blurred.delete();
        threshold.delete();
        contours.delete();
        hierarchy.delete();
    }