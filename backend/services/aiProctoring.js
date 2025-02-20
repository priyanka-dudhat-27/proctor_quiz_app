const tf = require('@tensorflow/tfjs-node');
const faceapi = require('face-api.js');

class AIProctoring {
  constructor() {
    this.model = null;
    this.faceDetectionOptions = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.5
    });
  }

  async initialize() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
    await faceapi.nets.faceExpressionNet.loadFromDisk('./models');
  }

  async detectSuspiciousActivity(frame) {
    const detections = await faceapi.detectAllFaces(frame, this.faceDetectionOptions)
      .withFaceLandmarks()
      .withFaceExpressions();

    const alerts = [];

    // Multiple face detection
    if (detections.length > 1) {
      alerts.push('Multiple faces detected');
    }

    // Gaze detection
    detections.forEach(detection => {
      const landmarks = detection.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const gazeDirection = this.calculateGazeDirection(leftEye, rightEye);

      if (gazeDirection !== 'center') {
        alerts.push(`User looking ${gazeDirection}`);
      }
    });

    // Face expression analysis
    detections.forEach(detection => {
      const expressions = detection.expressions;
      if (this.analyzeFacialExpressions(expressions)) {
        alerts.push('Suspicious facial expression detected');
      }
    });

    return alerts;
  }

  calculateGazeDirection(leftEye, rightEye) {
    const leftEyeCenter = this.calculateCenter(leftEye);
    const rightEyeCenter = this.calculateCenter(rightEye);

    const eyeVector = {
      x: rightEyeCenter.x - leftEyeCenter.x,
      y: rightEyeCenter.y - leftEyeCenter.y
    };

    const angle = Math.atan2(eyeVector.y, eyeVector.x) * (180 / Math.PI);

    if (angle < -45) return 'left';
    if (angle > 45) return 'right';
    if (eyeVector.y < -10) return 'up';
    if (eyeVector.y > 10) return 'down';
    return 'center';
  }

  calculateCenter(points) {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });

    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  analyzeFacialExpressions(expressions) {
    const suspiciousExpressions = ['angry', 'disgusted', 'fearful'];
    const threshold = 0.7;

    return suspiciousExpressions.some(expression => 
      expressions[expression] > threshold
    );
  }
}

module.exports = new AIProctoring();
