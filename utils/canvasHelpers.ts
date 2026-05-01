import { Canvas, Rect, Circle, IText, Image, Triangle, Polygon } from 'fabric';

export const addRect = (canvas: Canvas, options: any) => {
  const rect = new Rect({
    left: 100,
    top: 100,
    fill: options.fill || '#3b82f6',
    width: 100,
    height: 100,
    ...options
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
};

export const addCircle = (canvas: Canvas, options: any) => {
  const circle = new Circle({
    left: 100,
    top: 100,
    fill: options.fill || '#3b82f6',
    radius: 50,
    ...options
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
};

export const addTriangle = (canvas: Canvas, options: any) => {
  const triangle = new Triangle({
    left: 100,
    top: 100,
    fill: options.fill || '#3b82f6',
    width: 100,
    height: 100,
    ...options
  });
  canvas.add(triangle);
  canvas.setActiveObject(triangle);
};

export const addStar = (canvas: Canvas, options: any) => {
  const points = [];
  const spikes = 5;
  const outerRadius = 50;
  const innerRadius = 25;
  let cx = 50;
  let cy = 50;
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    points.push({ x: x, y: y });
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    points.push({ x: x, y: y });
    rot += step;
  }

  const star = new Polygon(points, {
    left: 100,
    top: 100,
    fill: options.fill || '#3b82f6',
    ...options
  });
  canvas.add(star);
  canvas.setActiveObject(star);
};

export const addText = (canvas: Canvas, text: string, options: any) => {
  const iText = new IText(text, {
    left: 100,
    top: 100,
    fontFamily: 'Inter',
    ...options
  });
  canvas.add(iText);
  canvas.setActiveObject(iText);
};

export const addImage = async (canvas: Canvas, url: string) => {
  try {
    const img = await Image.fromURL(url, { crossOrigin: 'anonymous' });
    
    // Scale to fit canvas if needed
    if (img.width! > canvas.width! * 0.8) {
      img.scaleToWidth(canvas.width! * 0.8);
    }
    
    canvas.add(img);
    canvas.centerObject(img);
    canvas.setActiveObject(img);
  } catch (error) {
    console.error('Error adding image:', error);
  }
};
