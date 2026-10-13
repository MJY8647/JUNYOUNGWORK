package com.junyoung.lumi;

/** Pure Java image pipeline. Input is immutable; every render starts from the original. */
public final class PhotoEngine {
    public static final class Retouch {
        public final boolean reshape;
        public final float x,y,radius,dx,dy;
        public Retouch(boolean reshape,float x,float y,float radius,float dx,float dy){this.reshape=reshape;this.x=x;this.y=y;this.radius=radius;this.dx=dx;this.dy=dy;}
    }
    /** Local brush edits use normalized original coordinates, independent of crop and rotation. */
    public static int[] retouch(int[] source,int w,int h,java.util.List<Retouch> edits){
        int[] pixels=source;
        for(Retouch edit:edits){
            if(Thread.currentThread().isInterrupted())throw new java.util.concurrent.CancellationException();
            int[] out=pixels.clone();float cx=edit.x*(w-1),cy=edit.y*(h-1),radius=Math.max(2,edit.radius*Math.min(w,h));
            int left=Math.max(0,(int)(cx-radius)),right=Math.min(w-1,(int)(cx+radius)),top=Math.max(0,(int)(cy-radius)),bottom=Math.min(h-1,(int)(cy+radius));
            float meanR=0,meanG=0,meanB=0;int count=0;
            if(!edit.reshape){for(int k=0;k<48;k++){double angle=k*Math.PI/24;int x=Math.max(0,Math.min(w-1,Math.round(cx+(float)Math.cos(angle)*radius*1.12f))),y=Math.max(0,Math.min(h-1,Math.round(cy+(float)Math.sin(angle)*radius*1.12f)));int p=pixels[y*w+x];meanR+=(p>>16)&255;meanG+=(p>>8)&255;meanB+=p&255;count++;}meanR/=count;meanG/=count;meanB/=count;}
            for(int y=top;y<=bottom;y++)for(int x=left;x<=right;x++){
                float d=((x-cx)*(x-cx)+(y-cy)*(y-cy))/(radius*radius);if(d>=1)continue;float weight=(1-d)*(1-d);int i=y*w+x,p=pixels[i];
                if(edit.reshape){float sx=Math.max(0,Math.min(w-1,x-edit.dx*w*weight)),sy=Math.max(0,Math.min(h-1,y-edit.dy*h*weight));int x0=(int)sx,y0=(int)sy,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1);float fx=sx-x0,fy=sy-y0;int value=0;for(int shift=0;shift<=24;shift+=8){float a=((pixels[y0*w+x0]>>>shift)&255)*(1-fx)+((pixels[y0*w+x1]>>>shift)&255)*fx;float b=((pixels[y1*w+x0]>>>shift)&255)*(1-fx)+((pixels[y1*w+x1]>>>shift)&255)*fx;value|=Math.round(a*(1-fy)+b*fy)<<shift;}out[i]=value;}
                else {float blend=Math.min(1,weight*1.8f);int r=(p>>16)&255,g=(p>>8)&255,b=p&255;out[i]=(p&0xff000000)|(Math.round(r+(meanR-r)*blend)<<16)|(Math.round(g+(meanG-g)*blend)<<8)|Math.round(b+(meanB-b)*blend);}
            }
            pixels=out;
        }
        return pixels;
    }
    public static final class Settings {
        public float smooth, exposure, contrast, saturation, warmth, highlights, vignette, filterAmount = .7f;
        public int filter;
        public Settings copy() {
            Settings s = new Settings();
            s.smooth=smooth; s.exposure=exposure; s.contrast=contrast; s.saturation=saturation;
            s.warmth=warmth; s.highlights=highlights; s.vignette=vignette;
            s.filter=filter; s.filterAmount=filterAmount; return s;
        }
    }
    private static float clamp(float x) { return Math.max(0, Math.min(1, x)); }
    private static int byteValue(float x) { return Math.round(clamp(x)*255); }
    public static int[] render(int[] source, int width, int height, Settings s) {
        if (width<=0 || height<=0 || source.length!=width*height) throw new IllegalArgumentException("Invalid dimensions");
        int[] base=source;
        if (s.smooth>0) base=smooth(source,width,height,s.smooth);
        int[] out=new int[source.length];
        float gain=(float)Math.pow(2,s.exposure*1.4), contrast=1+s.contrast*.65f;
        for (int y=0;y<height;y++) {
            if (Thread.currentThread().isInterrupted()) throw new java.util.concurrent.CancellationException();
            for(int x=0;x<width;x++) {
                int i=y*width+x,p=base[i];
                float r=((p>>16)&255)/255f,g=((p>>8)&255)/255f,b=(p&255)/255f;
                r*=gain;g*=gain;b*=gain;
                float l=.2126f*r+.7152f*g+.0722f*b;
                float hi=s.highlights*.35f*clamp((l-.45f)/.55f);
                r-=hi;g-=hi;b-=hi;
                r=(r-.5f)*contrast+.5f;g=(g-.5f)*contrast+.5f;b=(b-.5f)*contrast+.5f;
                l=.2126f*r+.7152f*g+.0722f*b;
                float sat=1+s.saturation*.8f;
                r=l+(r-l)*sat+s.warmth*.09f;g=l+(g-l)*sat+s.warmth*.015f;b=l+(b-l)*sat-s.warmth*.09f;
                float fr=r,fg=g,fb=b;
                switch(s.filter) {
                    case 1: fr=r*1.04f+.025f;fg=g*1.01f+.015f;fb=b*.93f+.02f;break;
                    case 2: fr=r*.96f+.02f;fg=g*1.02f+.02f;fb=b*1.06f+.025f;break;
                    case 3: fr=.08f+r*.86f;fg=.055f+g*.88f;fb=.045f+b*.86f;break;
                    case 4: fr=fg=fb=clamp(l*1.08f-.035f);break;
                }
                r+=(fr-r)*s.filterAmount;g+=(fg-g)*s.filterAmount;b+=(fb-b)*s.filterAmount;
                float dx=(x-width*.5f)/(width*.5f),dy=(y-height*.5f)/(height*.5f);
                float v=1-s.vignette*.45f*clamp((dx*dx+dy*dy)*.5f);
                out[i]=(p&0xff000000)|(byteValue(r*v)<<16)|(byteValue(g*v)<<8)|byteValue(b*v);
            }
        }
        return out;
    }
    /** Edge-aware bilateral smoothing with a feathered skin-color mask; no face reshaping. */
    private static int[] smooth(int[] src,int w,int h,float amount) {
        int[] out=new int[src.length];
        int radius=Math.max(2,Math.min(7,Math.round(Math.min(w,h)/240f)));
        int step=radius>4?2:1;
        float[] spatial=new float[(2*radius+1)*(2*radius+1)];
        for(int dy=-radius;dy<=radius;dy++) for(int dx=-radius;dx<=radius;dx++)
            spatial[(dy+radius)*(2*radius+1)+dx+radius]=(float)Math.exp(-(dx*dx+dy*dy)/(2f*radius*radius));
        float[] range=new float[766];
        for(int n=0;n<range.length;n++) range[n]=(float)Math.exp(-n*n/(2f*48*48));
        for(int y=0;y<h;y++) {
            if(Thread.currentThread().isInterrupted()) throw new java.util.concurrent.CancellationException();
            for(int x=0;x<w;x++) {
                int i=y*w+x,p=src[i],r=(p>>16)&255,g=(p>>8)&255,b=p&255;
                float cb=128-.168736f*r-.331264f*g+.5f*b,cr=128+.5f*r-.418688f*g-.081312f*b;
                float mask=clamp((cr-130)/12)*clamp((180-cr)/12)*clamp((cb-75)/12)*clamp((135-cb)/12)*clamp((r-35)/30f);
                if(mask==0) {out[i]=p;continue;}
                float rr=0,gg=0,bb=0,sum=0;
                for(int dy=-radius;dy<=radius;dy+=step) for(int dx=-radius;dx<=radius;dx+=step) {
                    int nx=Math.max(0,Math.min(w-1,x+dx)),ny=Math.max(0,Math.min(h-1,y+dy)),q=src[ny*w+nx];
                    int qr=(q>>16)&255,qg=(q>>8)&255,qb=q&255;
                    int d=Math.abs(qr-r)+Math.abs(qg-g)+Math.abs(qb-b);
                    float weight=spatial[(dy+radius)*(2*radius+1)+dx+radius]*range[d];
                    rr+=qr*weight;gg+=qg*weight;bb+=qb*weight;sum+=weight;
                }
                float mix=amount*.85f*mask;
                out[i]=(p&0xff000000)|(Math.round(r+(rr/sum-r)*mix)<<16)|(Math.round(g+(gg/sum-g)*mix)<<8)|Math.round(b+(bb/sum-b)*mix);
            }
        }
        return out;
    }
}
