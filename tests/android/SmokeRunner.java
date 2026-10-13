package com.junyoung.lumi.smoke;

import android.app.*;
import android.content.*;
import android.database.Cursor;
import android.graphics.*;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.*;
import android.provider.MediaStore;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.util.*;

/** Device-side functional smoke test; does not rely on an external test framework. */
public final class SmokeRunner extends Instrumentation {
    private Activity active;
    private int checks;
    @Override public void onCreate(Bundle args){super.onCreate(args);start();}
    private void check(boolean condition,String name){if(!condition)throw new AssertionError(name);checks++;Bundle b=new Bundle();b.putString("stream","PASS: "+name+"\n");sendStatus(0,b);}
    private View find(View root,String text){if(root instanceof TextView && ((TextView)root).getText().toString().equals(text))return root;if(root instanceof ViewGroup){ViewGroup g=(ViewGroup)root;for(int i=0;i<g.getChildCount();i++){View v=find(g.getChildAt(i),text);if(v!=null)return v;}}return null;}
    private void tap(String text){final boolean[] found={false};runOnMainSync(()->{View v=find(active.getWindow().getDecorView(),text);if(v!=null){found[0]=true;v.performClick();}});if(!found[0])throw new AssertionError("Missing UI action: "+text);waitForIdleSync();}
    private boolean contains(View root,String prefix){if(root instanceof TextView && ((TextView)root).getText().toString().startsWith(prefix))return true;if(root instanceof ViewGroup){ViewGroup g=(ViewGroup)root;for(int i=0;i<g.getChildCount();i++)if(contains(g.getChildAt(i),prefix))return true;}return false;}
    private void waitText(String prefix,long timeout)throws Exception{long end=SystemClock.uptimeMillis()+timeout;while(SystemClock.uptimeMillis()<end){boolean[] found={false};runOnMainSync(()->found[0]=contains(active.getWindow().getDecorView(),prefix));if(found[0])return;Thread.sleep(200);}throw new AssertionError("Timeout: "+prefix);}
    private ArrayList<Uri> owned(Uri table){ArrayList<Uri> list=new ArrayList<>();try(Cursor c=getTargetContext().getContentResolver().query(table,new String[]{"_id","_display_name"},"is_pending=0",null,null)){if(c!=null)while(c.moveToNext())if(c.getString(1).startsWith("LUMI_"))list.add(ContentUris.withAppendedId(table,c.getLong(0)));}return list;}
    private ArrayList<Uri> waitNew(Uri table,ArrayList<Uri> before)throws Exception{long end=SystemClock.uptimeMillis()+120000;while(SystemClock.uptimeMillis()<end){ArrayList<Uri> list=owned(table);list.removeAll(before);if(!list.isEmpty()){Thread.sleep(500);waitForIdleSync();return list;}Thread.sleep(250);}throw new AssertionError("Export did not publish a gallery file");}
    private void closeDialog(){sendKeySync(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_BACK));sendKeySync(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_BACK));waitForIdleSync();}
    private void selectedFiles(int request,Intent data){runOnMainSync(()->{try{java.lang.reflect.Method m=active.getClass().getDeclaredMethod("onActivityResult",int.class,int.class,Intent.class);m.setAccessible(true);m.invoke(active,request,Activity.RESULT_OK,data);}catch(Exception e){throw new RuntimeException(e);}});}
    private void seekBars(View view,ArrayList<SeekBar> bars){if(view instanceof SeekBar)bars.add((SeekBar)view);if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)seekBars(group.getChildAt(i),bars);}}
    private void scrub(SeekBar bar,float fraction){long t=SystemClock.uptimeMillis();MotionEvent down=MotionEvent.obtain(t,t,MotionEvent.ACTION_DOWN,bar.getWidth()*fraction,bar.getHeight()/2f,0);MotionEvent up=MotionEvent.obtain(t,t+1,MotionEvent.ACTION_UP,bar.getWidth()*fraction,bar.getHeight()/2f,0);bar.dispatchTouchEvent(down);bar.dispatchTouchEvent(up);down.recycle();up.recycle();}
    @Override public void onStart(){Bundle result=new Bundle();try{
        Intent main=new Intent();main.setClassName("com.junyoung.lumi","com.junyoung.lumi.MainActivity");main.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);active=startActivitySync(main);waitForIdleSync();check(find(active.getWindow().getDecorView(),"＋  내 사진으로 시작")!=null,"Home screen opens");
        tap("샘플 둘러보기");waitText("완료 ·",60000);check(true,"Sample preview renders");
        for(String tab:new String[]{"보정","피부","필터","리터치","구성"})tap(tab);check(true,"All photo tool tabs open");
        tap("↻ 회전");waitText("완료 ·",60000);ArrayList<Uri> before=owned(MediaStore.Images.Media.EXTERNAL_CONTENT_URI);tap("저장 ↗");ArrayList<Uri> after=waitNew(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,before);check(after.size()==1,"Photo export creates exactly one gallery file");
        try(InputStream in=getTargetContext().getContentResolver().openInputStream(after.get(0))){Bitmap b=BitmapFactory.decodeStream(in);check(b!=null&&b.getWidth()==1100&&b.getHeight()==900,"Rotated JPEG has expected dimensions");}
        closeDialog();tap("초기화");waitText("완료 ·",60000);tap("↶ 되돌리기");waitText("완료 ·",60000);check(true,"Reset and undo render successfully");
        selectedFiles(101,new Intent().setData(after.get(0)));waitText("완료 · 1100 × 900",60000);check(true,"System-picker result imports and decodes a real JPEG");
        Intent collage=new Intent();ClipData clips=ClipData.newRawUri("photos",after.get(0));clips.addItem(new ClipData.Item(after.get(0)));collage.setClipData(clips);selectedFiles(102,collage);waitText("완료 · 2000 × 2000",90000);check(true,"Two-photo collage renders at documented resolution");
        ArrayList<Uri> preCollage=owned(MediaStore.Images.Media.EXTERNAL_CONTENT_URI);tap("저장 ↗");ArrayList<Uri> savedCollage=waitNew(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,preCollage);check(savedCollage.size()==1,"Collage exports one gallery JPEG");try(InputStream in=getTargetContext().getContentResolver().openInputStream(savedCollage.get(0))){Bitmap b=BitmapFactory.decodeStream(in);check(b!=null&&b.getWidth()==2000&&b.getHeight()==2000,"Exported collage dimensions match preview");}after.addAll(savedCollage);closeDialog();runOnMainSync(()->active.finish());waitForIdleSync();
        ContentValues fixtureValues=new ContentValues();fixtureValues.put(MediaStore.Video.Media.DISPLAY_NAME,"smoke-input.mp4");fixtureValues.put(MediaStore.Video.Media.MIME_TYPE,"video/mp4");fixtureValues.put(MediaStore.Video.Media.RELATIVE_PATH,"Movies/LumiTests");Uri fixture=getTargetContext().getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI,fixtureValues);
        try(InputStream in=getContext().getAssets().open("smoke-input.mp4");OutputStream out=getTargetContext().getContentResolver().openOutputStream(fixture)){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);}
        Intent video=new Intent();video.setClassName("com.junyoung.lumi","com.junyoung.lumi.VideoActivity");video.setData(fixture);video.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_GRANT_READ_URI_PERMISSION);active=startActivitySync(video);waitForIdleSync();waitText("영상 저장 ↗",60000);check(true,"Video editor opens a real H.264 fixture");
        ArrayList<Uri> priorVideo=owned(MediaStore.Video.Media.EXTERNAL_CONTENT_URI);tap("영상 저장 ↗");ArrayList<Uri> videos=waitNew(MediaStore.Video.Media.EXTERNAL_CONTENT_URI,priorVideo);check(videos.size()==1,"Video export creates one MP4");
        try(MediaMetadataRetriever meta=new MediaMetadataRetriever()){meta.setDataSource(getTargetContext(),videos.get(0));long duration=Long.parseLong(meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));check(duration>=2800&&duration<=3200,"MP4 export preserves fixture duration");check("320".equals(meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)),"MP4 export preserves video resolution");}
        closeDialog();runOnMainSync(()->{ArrayList<SeekBar> bars=new ArrayList<>();seekBars(active.getWindow().getDecorView(),bars);if(bars.size()!=2)throw new AssertionError("Expected start and end sliders");scrub(bars.get(0),.52f);scrub(bars.get(1),.68f);});tap("오디오 제거");ArrayList<Uri> preTrim=owned(MediaStore.Video.Media.EXTERNAL_CONTENT_URI);tap("영상 저장 ↗");ArrayList<Uri> trimmed=waitNew(MediaStore.Video.Media.EXTERNAL_CONTENT_URI,preTrim);check(trimmed.size()==1,"Trim and mute create exactly one MP4");
        try(MediaMetadataRetriever meta=new MediaMetadataRetriever()){meta.setDataSource(getTargetContext(),trimmed.get(0));long length=Long.parseLong(meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));check(length>=850&&length<=1150,"Selected 1–2 second interval exports a one-second clip");check(!"yes".equals(meta.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO)),"Muted MP4 has no audio track");}videos.addAll(trimmed);
        closeDialog();runOnMainSync(()->active.finish());for(Uri u:after)getTargetContext().getContentResolver().delete(u,null,null);for(Uri u:videos)getTargetContext().getContentResolver().delete(u,null,null);getTargetContext().getContentResolver().delete(fixture,null,null);
        result.putString("stream","PASS: "+checks+" Android functional checks\n");finish(Activity.RESULT_OK,result);
    }catch(Throwable e){result.putString("stream","FAIL: "+e+"\n"+android.util.Log.getStackTraceString(e));finish(Activity.RESULT_CANCELED,result);}}
}
