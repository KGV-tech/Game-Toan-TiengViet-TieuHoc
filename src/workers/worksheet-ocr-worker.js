import { PaddleOCR } from '@paddleocr/paddleocr-js';
import cvModule from '@techstark/opencv-js';
let engine;
const base=new URL('./',self.location.href);
const notify=(id,stage)=>self.postMessage({id,stage});
async function cvReady(){if(cvModule instanceof Promise)return {cv:await cvModule};if(cvModule.Mat)return {cv:cvModule};await new Promise(resolve=>cvModule.onRuntimeInitialized=resolve);return {cv:cvModule};}
function imageOf(mat){return {width:mat.cols,height:mat.rows,data:new Uint8ClampedArray(mat.data)};}
function orderCorners(points){const sums=points.map(p=>p.x+p.y),diffs=points.map(p=>p.y-p.x);return [points[sums.indexOf(Math.min(...sums))],points[diffs.indexOf(Math.min(...diffs))],points[sums.indexOf(Math.max(...sums))],points[diffs.indexOf(Math.max(...diffs))]];}
function rectify(cv,source,notes,geometry) {
  const scale=Math.min(1,900/source.cols),small=new cv.Mat(),gray=new cv.Mat(),binary=new cv.Mat(),horizontal=new cv.Mat(),vertical=new cv.Mat(),mask=new cv.Mat();
  const contours=new cv.MatVector(),hierarchy=new cv.Mat();let transform,tableTarget;
  const allocated=[small,gray,binary,horizontal,vertical,mask,contours,hierarchy];
  try {
    cv.resize(source,small,new cv.Size(Math.round(source.cols*scale),Math.round(source.rows*scale)));
    cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(gray,binary,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY_INV,31,12);
    const hk=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(Math.max(30,Math.round(small.cols/8)),1)),vk=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(1,Math.max(30,Math.round(small.rows/8))));allocated.push(hk,vk);
    // Close short gaps before extracting table rulings, including slightly sloped ones.
    const closing=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(3,3));allocated.push(closing);
    cv.morphologyEx(binary,binary,cv.MORPH_CLOSE,closing);
    cv.morphologyEx(binary,horizontal,cv.MORPH_OPEN,hk);cv.morphologyEx(binary,vertical,cv.MORPH_OPEN,vk);cv.add(horizontal,vertical,mask);
    cv.findContours(binary,contours,hierarchy,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
    const rulings=new cv.Mat();allocated.push(rulings);cv.HoughLinesP(binary,rulings,1,Math.PI/180,70,small.rows*.18,20);
    let best=null,bestArea=0;
    for(let i=0;i<contours.size();i++){const contour=contours.get(i),approx=new cv.Mat();try{const area=cv.contourArea(contour);cv.approxPolyDP(contour,approx,cv.arcLength(contour,true)*.02,true);const rect=cv.boundingRect(contour),internal=[];
      for(let j=0;j<rulings.rows;j++){const a=rulings.data32S.subarray(j*4,j*4+4),x=(a[0]+a[2])/2,y=(a[1]+a[3])/2;if(Math.abs(a[2]-a[0])<Math.abs(a[3]-a[1])*.15&&Math.abs(a[3]-a[1])>rect.height*.25&&x>rect.x+10&&x<rect.x+rect.width-10&&y>rect.y&&y<rect.y+rect.height)internal.push(x);}
      const distinct=internal.sort((a,b)=>a-b).filter((x,i,a)=>i===0||x-a[i-1]>10);
      if(approx.rows===4&&distinct.length>=2&&area>small.cols*small.rows*.2&&area>bestArea){bestArea=area;best=Array.from({length:4},(_,j)=>({x:approx.data32S[j*2]/scale,y:approx.data32S[j*2+1]/scale}));}}finally{contour.delete();approx.delete();}}
    if(best){const p=orderCorners(best);const width=(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2,height=(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2;
      const left=Math.min(p[0].x,p[3].x),top=Math.min(p[0].y,p[1].y);
      const from=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(p=>[p.x,p.y])),to=cv.matFromArray(4,1,cv.CV_32FC2,[left,top,left+width,top,left+width,top+height,left,top+height]);allocated.push(from,to);
      tableTarget={left,top,width,height};transform=cv.getPerspectiveTransform(from,to);notes.push('Đã chỉnh phối cảnh theo đường bao bảng.');
    }else{
      const detected=new cv.Mat();allocated.push(detected);cv.HoughLinesP(binary,detected,1,Math.PI/180,90,small.cols*.4,20);const angles=[];
      for(let i=0;i<detected.rows;i++){const a=detected.data32S.subarray(i*4,i*4+4);let angle=Math.atan2(a[3]-a[1],a[2]-a[0])*180/Math.PI;if(angle>90)angle-=180;if(angle< -90)angle+=180;if(Math.abs(angle)<12)angles.push(angle);}
      angles.sort((a,b)=>a-b);const angle=angles[Math.floor(angles.length/2)]||0;
      if(Math.abs(angle)>.3){const rotation=cv.getRotationMatrix2D(new cv.Point(source.cols/2,source.rows/2),angle,1);allocated.push(rotation);transform=cv.matFromArray(3,3,cv.CV_64F,[...rotation.data64F,0,0,1]);notes.push(`Đã chỉnh nghiêng ${angle.toFixed(1)}°.`);}
    }
    if(!transform){notes.push('Không đủ đường kẻ để tự chỉnh phối cảnh; kiểm tra ảnh gốc.');return source.clone();}
    // Expand the canvas to retain all original page corners after the transform.
    const m=transform.data64F,corners=[[0,0],[source.cols,0],[source.cols,source.rows],[0,source.rows]].map(([x,y])=>{const z=m[6]*x+m[7]*y+m[8];return {x:(m[0]*x+m[1]*y+m[2])/z,y:(m[3]*x+m[4]*y+m[5])/z};});
    const minX=Math.min(...corners.map(p=>p.x)),minY=Math.min(...corners.map(p=>p.y)),width=Math.ceil(Math.max(...corners.map(p=>p.x))-minX),height=Math.ceil(Math.max(...corners.map(p=>p.y))-minY);
    if(!Number.isFinite(width+height)||width>source.cols*1.5||height>source.rows*1.5||width<source.cols*.7||height<source.rows*.7){notes.push('Phối cảnh quá mạnh, giữ ảnh gốc để tránh mất dữ liệu.');return source.clone();}
    for(let i=0;i<3;i++){m[i]-=minX*m[6+i];m[3+i]-=minY*m[6+i];}
    if(tableTarget)geometry.tableBounds={left:tableTarget.left-minX,top:tableTarget.top-minY,right:tableTarget.left+tableTarget.width-minX,bottom:tableTarget.top+tableTarget.height-minY};
    const output=new cv.Mat();try{cv.warpPerspective(source,output,transform,new cv.Size(width,height),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));return output;}catch(error){output.delete();throw error;}
  }finally{transform?.delete();allocated.forEach(mat=>mat.delete());}
}
function prepare(cv,original,removeColor,notes) {
  const cleaned=original.clone(),mask=cv.Mat.zeros(original.rows,original.cols,cv.CV_8UC1),dilated=new cv.Mat();
  const gray=new cv.Mat(),background=new cv.Mat(),balanced=new cv.Mat(),rgba=new cv.Mat();const kernel=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(5,5));
  try {
    if(removeColor){const d=original.data;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if((r-g>16&&b-g>16)||(r-g>30&&r-b>30)||(b-r>45&&b-g>25))mask.data[i/4]=255;}cv.dilate(mask,dilated,kernel);cleaned.setTo(new cv.Scalar(255,255,255,255),dilated);notes.push('Đã lọc nét màu; bút đen và chữ màu cần admin đối chiếu.');}
    cv.cvtColor(cleaned,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,background,new cv.Size(0,0),25);cv.divide(gray,background,balanced,255);cv.cvtColor(balanced,rgba,cv.COLOR_GRAY2RGBA);
    return {cleaned:cleaned.clone(),prepared:rgba.clone()};
  }finally{[cleaned,mask,dilated,gray,background,balanced,rgba,kernel].forEach(mat=>mat.delete());}
}
async function processImage(message){
  const {id,image,removeColor}=message;const mats=[];
  try{
    notify(id,'Đang chỉnh ảnh bằng OpenCV trên thiết bị…');const {cv}=await cvReady(),source=cv.matFromImageData(new ImageData(new Uint8ClampedArray(image.data),image.width,image.height));mats.push(source);const notes=[],geometry={},original=rectify(cv,source,notes,geometry);mats.push(original);const {cleaned,prepared}=prepare(cv,original,removeColor,notes);mats.push(cleaned,prepared);
    if(message.prepareOnly){self.postMessage({id,result:{original:imageOf(original),cleaned:imageOf(cleaned),prepared:imageOf(prepared),notes}});return;}
    if(!engine){notify(id,'Đang tải model PP-OCRv6 và WASM từ game (lần đầu có thể lâu)…');engine=await PaddleOCR.create({lang:'vi',ocrVersion:'PP-OCRv6',textDetectionModelName:'PP-OCRv6_small_det',textRecognitionModelName:'latin_PP-OCRv5_mobile_rec',textDetectionModelAsset:{url:new URL('PP-OCRv6_small_det.tar',base).href},textRecognitionModelAsset:{url:new URL('latin_PP-OCRv5_mobile_rec.tar',base).href},ortOptions:{backend:'wasm',wasmPaths:base.href,numThreads:1}});}
    notify(id,'Đang dò vùng chữ PP-OCRv6 và đọc ký tự Latin…');const [result]=await engine.predict(prepared,{textDetLimitSideLen:1600,textDetLimitType:'max',textRecScoreThresh:0});
    const words=result.items.map(item=>{const xs=item.poly.map(p=>p[0]),ys=item.poly.map(p=>p[1]);return{text:item.text,x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),confidence:item.score*100};});
    self.postMessage({id,result:{words,original:imageOf(original),cleaned:imageOf(cleaned),prepared:imageOf(prepared),notes,geometry,metrics:result.metrics}});
  }catch(error){self.postMessage({id,error:error.message||String(error)});}finally{mats.forEach(mat=>mat.delete());}
}
let queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.then(()=>processImage(data));};
