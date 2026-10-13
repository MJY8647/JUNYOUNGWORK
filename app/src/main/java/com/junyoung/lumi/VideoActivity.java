package com.junyoung.lumi;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.media.*;
import android.net.Uri;
import android.os.*;
import android.provider.MediaStore;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.nio.ByteBuffer;
import java.util.concurrent.*;

/** Lossless MP4 remuxing. Start snaps to the previous keyframe, explicitly shown in the UI. */
public final class VideoActivity extends Activity {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private VideoView video; private Uri source;private int duration,start,end,rotation;private boolean muted,busy,destroyed;
    private TextView range,save;private SeekBar startBar,endBar;
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private TextView text(String s,int size,int color){TextView t=new TextView(this);t.setText(s);t.setTextColor(color);t.setTextSize(size);t.setPadding(0,dp(8),0,dp(8));return t;}
    @Override public void onCreate(Bundle saved){super.onCreate(saved);source=getIntent().getData();if(source==null){finish();return;}
        try(MediaMetadataRetriever meta=new MediaMetadataRetriever()){meta.setDataSource(this,source);duration=(int)Math.ceil(Long.parseLong(meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION))/1000d);String r=meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION);rotation=r==null?0:Integer.parseInt(r);}catch(Exception e){new AlertDialog.Builder(this).setTitle("영상을 열 수 없습니다").setMessage("MP4 영상을 선택해 주세요.").setPositiveButton("확인",(d,w)->finish()).show();return;}
        start=saved==null?0:saved.getInt("start");end=saved==null?duration:saved.getInt("end",duration);muted=saved!=null&&saved.getBoolean("muted");
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xff101211);root.setPadding(dp(24),dp(20),dp(24),dp(24));setContentView(root);root.setOnApplyWindowInsetsListener((v,in)->{if(Build.VERSION.SDK_INT>=35){android.graphics.Insets b=in.getInsets(WindowInsets.Type.systemBars());root.setPadding(dp(24)+b.left,dp(20)+b.top,dp(24)+b.right,dp(24)+b.bottom);}else root.setPadding(dp(24),dp(20),dp(24),dp(24));return in;});
        TextView back=text("‹  LUMI / VIDEO",20,Color.WHITE);back.setOnClickListener(v->{if(!busy)finish();});root.addView(back);
        FrameLayout player=new FrameLayout(this);video=new VideoView(this);player.addView(video,new FrameLayout.LayoutParams(-1,-1,Gravity.CENTER));root.addView(player,new LinearLayout.LayoutParams(-1,0,1));MediaController controls=new MediaController(this);controls.setAnchorView(video);video.setMediaController(controls);video.setVideoURI(source);video.setOnPreparedListener(mp->{mp.setLooping(false);video.seekTo(start*1000);});video.setOnErrorListener((mp,what,extra)->{new AlertDialog.Builder(this).setMessage("이 기기에서 미리보기를 재생할 수 없는 영상입니다.").setPositiveButton("확인",null).show();return true;});
        range=text("",18,0xffb6f277);root.addView(range);root.addView(text("시작",12,0xff9ba49b));startBar=new SeekBar(this);startBar.setMax(Math.max(0,duration-1));startBar.setProgress(start);root.addView(startBar);root.addView(text("끝",12,0xff9ba49b));endBar=new SeekBar(this);endBar.setMax(duration);endBar.setProgress(end);root.addView(endBar);
        startBar.setOnSeekBarChangeListener(listener(true));endBar.setOnSeekBarChangeListener(listener(false));Switch mute=new Switch(this);mute.setText("오디오 제거");mute.setTextColor(Color.WHITE);mute.setChecked(muted);mute.setOnCheckedChangeListener((b,checked)->muted=checked);root.addView(mute);
        root.addView(text("재인코딩 없이 원본 화질로 저장합니다.\n시작점은 앞쪽 키프레임으로 이동할 수 있습니다.\n영상 필터·속도·자막은 이 버전에 포함되지 않습니다.",12,0xff9ba49b));
        save=text("영상 저장 ↗",16,0xff101211);save.setGravity(Gravity.CENTER);GradientDrawable bg=new GradientDrawable();bg.setColor(0xffb6f277);bg.setCornerRadius(dp(18));save.setBackground(bg);save.setPadding(dp(16),dp(16),dp(16),dp(16));save.setOnClickListener(v->{if(!busy)export();});root.addView(save);update();
    }
    private SeekBar.OnSeekBarChangeListener listener(boolean first){return new SeekBar.OnSeekBarChangeListener(){public void onStartTrackingTouch(SeekBar s){}public void onStopTrackingTouch(SeekBar s){video.seekTo(start*1000);}public void onProgressChanged(SeekBar s,int p,boolean user){if(!user)return;if(first){start=Math.min(p,end-1);if(start<0)start=0;startBar.setProgress(start);}else{end=Math.max(p,start+1);endBar.setProgress(end);}update();}};}
    private void update(){range.setText(getString(R.string.video_range,time(start),time(end),end-start));}
    private String time(int seconds){return String.format(java.util.Locale.ROOT,"%02d:%02d",seconds/60,seconds%60);}
    @Override protected void onSaveInstanceState(Bundle b){b.putInt("start",start);b.putInt("end",end);b.putBoolean("muted",muted);super.onSaveInstanceState(b);}
    private void export(){busy=true;save.setText("원본 화질로 저장 중…");video.pause();final int from=start,to=end;final boolean silent=muted;startBar.setEnabled(false);endBar.setEnabled(false);
        worker.submit(()->{Uri output=null;MediaExtractor extractor=new MediaExtractor();MediaMuxer muxer=null;boolean started=false;try{
            extractor.setDataSource(this,source,null);int videoTrack=-1,audioTrack=-1;for(int i=0;i<extractor.getTrackCount();i++){String mime=extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME);if(mime!=null&&mime.startsWith("video/")&&videoTrack<0)videoTrack=i;else if(mime!=null&&mime.startsWith("audio/")&&audioTrack<0)audioTrack=i;}if(videoTrack<0)throw new IOException("No video track");
            extractor.selectTrack(videoTrack);extractor.seekTo(from*1000000L,MediaExtractor.SEEK_TO_PREVIOUS_SYNC);long actualStart=extractor.getSampleTime();if(actualStart<0)throw new IOException("No samples");if(!silent&&audioTrack>=0)extractor.selectTrack(audioTrack);extractor.seekTo(actualStart,MediaExtractor.SEEK_TO_PREVIOUS_SYNC);
            ContentValues values=new ContentValues();values.put(MediaStore.Video.Media.DISPLAY_NAME,"LUMI_"+System.currentTimeMillis()+".mp4");values.put(MediaStore.Video.Media.MIME_TYPE,"video/mp4");values.put(MediaStore.Video.Media.RELATIVE_PATH,"Movies/LUMI");values.put(MediaStore.Video.Media.IS_PENDING,1);output=getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI,values);if(output==null)throw new IOException("MediaStore unavailable");
            try(ParcelFileDescriptor fd=getContentResolver().openFileDescriptor(output,"rw")){if(fd==null)throw new IOException("Output unavailable");muxer=new MediaMuxer(fd.getFileDescriptor(),MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);if(rotation!=0)muxer.setOrientationHint(rotation);int v=muxer.addTrack(extractor.getTrackFormat(videoTrack)),a=-1;if(!silent&&audioTrack>=0)a=muxer.addTrack(extractor.getTrackFormat(audioTrack));muxer.start();started=true;
                ByteBuffer buffer=ByteBuffer.allocateDirect(1024*1024);MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();int frames=0;
                while(extractor.getSampleTrackIndex()>=0&&extractor.getSampleTime()<to*1000000L){if(Thread.currentThread().isInterrupted())throw new InterruptedIOException();long sampleSize=extractor.getSampleSize();if(sampleSize>32*1024*1024)throw new IOException("Sample too large");if(sampleSize>buffer.capacity())buffer=ByteBuffer.allocateDirect((int)sampleSize);buffer.clear();int size=extractor.readSampleData(buffer,0);if(size<0)break;long t=extractor.getSampleTime();if(t>=actualStart){int flags=(extractor.getSampleFlags()&MediaExtractor.SAMPLE_FLAG_SYNC)!=0?MediaCodec.BUFFER_FLAG_KEY_FRAME:0;info.set(0,size,t-actualStart,flags);int target=extractor.getSampleTrackIndex()==videoTrack?v:a;if(target>=0){muxer.writeSampleData(target,buffer,info);if(target==v)frames++;}}extractor.advance();}
                if(frames==0)throw new IOException("No video samples written");muxer.stop();started=false;muxer.release();muxer=null;
            }
            values.clear();values.put(MediaStore.Video.Media.IS_PENDING,0);getContentResolver().update(output,values,null,null);final long actual=actualStart;runOnUiThread(()->{if(destroyed)return;restore();new AlertDialog.Builder(this).setTitle("영상을 저장했습니다").setMessage("Movies/LUMI 폴더 · 실제 시작 "+String.format(java.util.Locale.ROOT,"%.2f",actual/1000000d)+"초").setPositiveButton("확인",null).show();});
        }catch(Exception|OutOfMemoryError e){if(output!=null)getContentResolver().delete(output,null,null);runOnUiThread(()->{if(destroyed)return;restore();new AlertDialog.Builder(this).setTitle("저장하지 못했습니다").setMessage("MP4(H.264/AAC) 영상과 기기 저장 공간을 확인해 주세요.").setPositiveButton("확인",null).show();});}finally{extractor.release();if(muxer!=null){if(started)try{muxer.stop();}catch(Exception ignored){}muxer.release();}}});
    }
    private void restore(){busy=false;save.setText("영상 저장 ↗");startBar.setEnabled(true);endBar.setEnabled(true);}
    @Override protected void onPause(){if(video!=null)video.pause();super.onPause();}
    @Override public void onBackPressed(){if(!busy)super.onBackPressed();}
    @Override protected void onDestroy(){destroyed=true;if(video!=null)video.stopPlayback();worker.shutdownNow();super.onDestroy();}
}
