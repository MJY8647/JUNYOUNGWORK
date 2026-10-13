import com.junyoung.lumi.PhotoEngine;
import java.util.*;

public class PhotoEngineTest {
    static int checks=0;
    static void check(boolean result,String name){if(!result)throw new AssertionError(name);checks++;}
    static int red(int p){return (p>>16)&255;}
    public static void main(String[] args){
        PhotoEngine.Settings s=new PhotoEngine.Settings();
        int[] samples={0xff000000,0xffffffff,0xffa37b62,0x8055bb77,0xff0000ff};
        check(Arrays.equals(samples,PhotoEngine.render(samples,5,1,s)),"Zero settings preserve every channel and alpha");
        int[] before=samples.clone();s.exposure=.5f;int[] bright=PhotoEngine.render(samples,5,1,s);
        check(red(bright[2])>red(samples[2]),"Exposure brightens midtones");
        check(Arrays.equals(samples,before),"Original pixels remain immutable");
        s=new PhotoEngine.Settings();s.saturation=-1;int p=PhotoEngine.render(new int[]{0xffdd4411},1,1,s)[0];
        check(Math.abs(red(p)-((p>>8)&255))<Math.abs(0xdd-0x44),"Desaturation reduces channel separation");
        s=new PhotoEngine.Settings();s.filter=4;s.filterAmount=1;p=PhotoEngine.render(new int[]{0xffaa5533},1,1,s)[0];
        check(red(p)==((p>>8)&255)&&red(p)==(p&255),"Mono is neutral grayscale");
        s=new PhotoEngine.Settings();s.filter=1;s.filterAmount=0;
        check(Arrays.equals(samples,PhotoEngine.render(samples,5,1,s)),"Filter at zero preserves original");
        int w=31,h=31;int[] skin=new int[w*h];Random random=new Random(13);
        for(int i=0;i<skin.length;i++){int noise=random.nextInt(17)-8;skin[i]=0xff000000|((204+noise)<<16)|((150+noise)<<8)|(115+noise);}
        s=new PhotoEngine.Settings();s.smooth=1;int[] soft=PhotoEngine.render(skin,w,h,s);
        double a=0,b=0;for(int i=0;i<skin.length;i++){a+=Math.pow(red(skin[i])-204,2);b+=Math.pow(red(soft[i])-204,2);}
        check(b<a*.6,"Skin smoothing reduces texture noise");
        int[] blue=new int[w*h];Arrays.fill(blue,0xff2255ee);
        check(Arrays.equals(blue,PhotoEngine.render(blue,w,h,s)),"Non-skin blue regions stay unchanged");
        int[] edge=new int[w*h];for(int y=0;y<h;y++)for(int x=0;x<w;x++)edge[y*w+x]=x<15?0xffcc9673:0xff171717;
        int[] edged=PhotoEngine.render(edge,w,h,s);
        check(Math.abs(red(edged[15*w+14])-204)<5&&red(edged[15*w+15])==23,"Strong edges remain sharp");
        s=new PhotoEngine.Settings();s.exposure=1;s.contrast=1;s.saturation=1;s.warmth=1;s.highlights=1;
        p=PhotoEngine.render(new int[]{0x80ffffff},1,1,s)[0];check((p>>>24)==128,"Extreme settings preserve alpha");
        boolean rejected=false;try{PhotoEngine.render(samples,2,2,s);}catch(IllegalArgumentException e){rejected=true;}
        check(rejected,"Invalid dimensions fail explicitly");
        Thread.currentThread().interrupt();boolean cancelled=false;try{PhotoEngine.render(samples,5,1,s);}catch(java.util.concurrent.CancellationException e){cancelled=true;}finally{Thread.interrupted();}
        check(cancelled,"Superseded renders cancel cooperatively");
        int[] blemish=new int[21*21];Arrays.fill(blemish,0xffcc9977);blemish[10*21+10]=0xff663322;
        int[] healed=PhotoEngine.retouch(blemish,21,21,List.of(new PhotoEngine.Retouch(false,.5f,.5f,.15f,0,0)));
        check(healed[10*21+10]==0xffcc9977,"Spot brush replaces center with surrounding color");
        check(healed[0]==blemish[0]&&blemish[10*21+10]==0xff663322,"Spot brush keeps distant pixels and original intact");
        int[] warp=PhotoEngine.retouch(blemish,21,21,List.of(new PhotoEngine.Retouch(true,.5f,.5f,.3f,0,0)));
        check(Arrays.equals(blemish,warp),"Zero displacement warp is identity");
        warp=PhotoEngine.retouch(blemish,21,21,List.of(new PhotoEngine.Retouch(true,.5f,.5f,.3f,.05f,0)));
        check(warp[0]==blemish[0]&&warp[10*21+10]!=blemish[10*21+10],"Warp changes local geometry and preserves boundary");
        System.out.println("PASS: "+checks+" image-processing checks");
    }
}
