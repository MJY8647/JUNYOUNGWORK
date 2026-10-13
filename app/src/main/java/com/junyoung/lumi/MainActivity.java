package com.junyoung.lumi;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.provider.MediaStore;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public final class MainActivity extends Activity {
    private static final int BG=0xff101211, PANEL=0xff1d211e, INK=0xfff3f5ef, MUTED=0xff9ba49b, ACCENT=0xffb6f277;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final Handler handler=new Handler(Looper.getMainLooper());
    private Future<?> renderTask;
    private Bitmap original, preview, rendered;
    private LinearLayout root, tools;
    private PhotoView photo;
    private TextView status, undoButton, redoButton, saveButton;
    private State state=new State();
    private final ArrayDeque<State> undo=new ArrayDeque<>();
    private final ArrayDeque<State> redo=new ArrayDeque<>();
    private int generation=0;
    private boolean busy=false, destroyed=false, demo=false;
    private String tab="보정";
    private int brush=0;
    private float brushRadius=.05f;
    private int collageLayout=0;
    private static final class Session {
        Bitmap original,preview;State state;ArrayDeque<State> undo,redo;boolean demo;
    }
    private static final class State {
        PhotoEngine.Settings s=new PhotoEngine.Settings();
        int rotation,crop; boolean flip,frame; String caption="";
        ArrayList<PhotoEngine.Retouch> edits=new ArrayList<>();
        State copy(){State t=new State();t.s=s.copy();t.rotation=rotation;t.crop=crop;t.flip=flip;t.frame=frame;t.caption=caption;t.edits=new ArrayList<>(edits);return t;}
    }
    @Override public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        getWindow().setStatusBarColor(BG);getWindow().setNavigationBarColor(BG);
        Session retained=(Session)getLastNonConfigurationInstance();
        if(retained!=null){original=retained.original;preview=retained.preview;state=retained.state;undo.addAll(retained.undo);redo.addAll(retained.redo);demo=retained.demo;editor();render();}else home();
    }
    @Override public Object onRetainNonConfigurationInstance(){if(original==null)return null;Session s=new Session();s.original=original;s.preview=preview;s.state=state.copy();s.undo=new ArrayDeque<>(undo);s.redo=new ArrayDeque<>(redo);s.demo=demo;return s;}
    private int dp(float n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private LinearLayout column(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private LinearLayout row(){LinearLayout l=new LinearLayout(this);l.setGravity(Gravity.CENTER_VERTICAL);return l;}
    private GradientDrawable background(int color,int radius){GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(radius));return g;}
    private TextView label(String text,int size,int color){TextView t=new TextView(this);t.setText(text);t.setTextSize(size);t.setTextColor(color);t.setGravity(Gravity.CENTER_VERTICAL);return t;}
    private TextView button(String text,boolean primary,Runnable action){TextView b=label(text,14,primary?BG:INK);b.setGravity(Gravity.CENTER);b.setTypeface(null,Typeface.BOLD);b.setPadding(dp(16),dp(12),dp(16),dp(12));b.setBackground(background(primary?ACCENT:PANEL,18));b.setOnClickListener(v->{if(!busy)action.run();});return b;}
    private void gap(LinearLayout l,int n){Space s=new Space(this);l.addView(s,new LinearLayout.LayoutParams(1,dp(n)));}
    private void mount(){
        root=column();root.setBackgroundColor(BG);root.setPadding(dp(20),dp(12),dp(20),dp(16));setContentView(root);
        root.setOnApplyWindowInsetsListener((v,in)->{if(Build.VERSION.SDK_INT>=35){android.graphics.Insets b=in.getInsets(WindowInsets.Type.systemBars());root.setPadding(dp(20)+b.left,dp(12)+b.top,dp(20)+b.right,dp(16)+b.bottom);}else root.setPadding(dp(20),dp(12),dp(20),dp(16));return in;});
    }
    private void home(){
        mount();LinearLayout head=row();TextView brand=label("LUMI",26,INK);brand.setLetterSpacing(.18f);brand.setTypeface(null,Typeface.BOLD);
        head.addView(brand,new LinearLayout.LayoutParams(0,dp(44),1));head.addView(label("PHOTO STUDIO",10,ACCENT));root.addView(head);gap(root,12);
        TextView eyebrow=label("YOUR LIGHT, YOUR LOOK",11,ACCENT);eyebrow.setLetterSpacing(.14f);root.addView(eyebrow);gap(root,8);
        TextView title=label("당신의 순간을,\n더 당신답게.",28,INK);title.setTypeface(null,Typeface.BOLD);root.addView(title);gap(root,8);
        root.addView(label("자연스러운 보정부터 나만의 색감까지",12,MUTED));gap(root,12);
        PhotoView hero=new PhotoView();hero.image=demoImage();hero.fill=true;hero.setBackground(background(PANEL,24));hero.setClipToOutline(true);root.addView(hero,new LinearLayout.LayoutParams(-1,0,1));gap(root,8);
        root.addView(label("색감 편집 데모 · 실제 인물 사진이 아닙니다",10,MUTED));gap(root,12);
        root.addView(button("＋  내 사진으로 시작",true,this::pick),new LinearLayout.LayoutParams(-1,dp(54)));gap(root,8);
        LinearLayout secondary=row();secondary.addView(button("샘플 둘러보기",false,()->loadDemo()),new LinearLayout.LayoutParams(0,dp(44),1));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(0,dp(44),1);cp.leftMargin=dp(8);secondary.addView(button("콜라주 만들기",false,this::pickCollage),cp);root.addView(secondary);gap(root,10);
        root.addView(button("영상 자르기  /  음소거",false,()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("video/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,103);}),new LinearLayout.LayoutParams(-1,dp(44)));gap(root,8);
        TextView footer=label("모든 기능 무료  ·  워터마크 없음  ·  기기 내 처리",10,MUTED);footer.setGravity(Gravity.CENTER);root.addView(footer);
    }
    private void pick(){Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("image/*");i.addCategory(Intent.CATEGORY_OPENABLE);i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivityForResult(i,101);}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(result!=RESULT_OK||data==null)return;if(request==101&&data.getData()!=null)load(data.getData());if(request==103&&data.getData()!=null){Intent i=new Intent(this,VideoActivity.class);i.setData(data.getData());i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivity(i);}if(request==102){ArrayList<Uri> uris=new ArrayList<>();if(data.getClipData()!=null)for(int i=0;i<Math.min(9,data.getClipData().getItemCount());i++)uris.add(data.getClipData().getItemAt(i).getUri());else if(data.getData()!=null)uris.add(data.getData());if(uris.size()<2)message("사진을 더 선택해 주세요","콜라주는 2~9장의 사진으로 만들 수 있습니다.");else collage(uris);}}
    private void pickCollage(){new AlertDialog.Builder(this).setTitle("콜라주 레이아웃").setItems(new String[]{"정사각 그리드","세로 스트립","가로 스트립"},(d,which)->{collageLayout=which;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("image/*");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);startActivityForResult(i,102);}).show();}
    private void collage(ArrayList<Uri> uris){busy=true;Toast.makeText(this,"콜라주를 만드는 중…",Toast.LENGTH_SHORT).show();final int layout=collageLayout;worker.submit(()->{try{
        int count=uris.size(),cols=layout==1?1:layout==2?count:(int)Math.ceil(Math.sqrt(count)),rows=(int)Math.ceil(count/(float)cols);
        int width=2000,height=layout==1?Math.min(3000,1000*count):layout==2?1200:2000;
        Bitmap result=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(result);canvas.drawColor(Color.WHITE);Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);int margin=24;
        for(int n=0;n<count;n++){ImageDecoder.Source src=ImageDecoder.createSource(getContentResolver(),uris.get(n));Bitmap b=ImageDecoder.decodeBitmap(src,(dec,info,s)->{dec.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);dec.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB));android.util.Size z=info.getSize();float f=Math.min(1,1400f/Math.max(z.getWidth(),z.getHeight()));dec.setTargetSize(Math.max(1,Math.round(z.getWidth()*f)),Math.max(1,Math.round(z.getHeight()*f)));});
            RectF dest=new RectF((n%cols)*width/(float)cols+margin,(n/cols)*height/(float)rows+margin,(n%cols+1)*width/(float)cols-margin,(n/cols+1)*height/(float)rows-margin);float aspect=dest.width()/dest.height();int sw=b.getWidth(),sh=b.getHeight();if(sw/(float)sh>aspect)sw=Math.round(sh*aspect);else sh=Math.round(sw/aspect);Rect crop=new Rect((b.getWidth()-sw)/2,(b.getHeight()-sh)/2,(b.getWidth()+sw)/2,(b.getHeight()+sh)/2);canvas.drawBitmap(b,crop,dest,paint);b.recycle();}
        handler.post(()->{if(destroyed)return;busy=false;demo=false;setImage(result);});
    }catch(Exception|OutOfMemoryError e){handler.post(()->{busy=false;message("콜라주를 만들지 못했습니다","다른 사진이나 더 적은 수의 사진으로 다시 시도해 주세요.");});}});}
    private void load(Uri uri){
        busy=true;Toast.makeText(this,"사진을 불러오는 중…",Toast.LENGTH_SHORT).show();
        worker.submit(()->{try{
            ImageDecoder.Source src=ImageDecoder.createSource(getContentResolver(),uri);
            Bitmap image=ImageDecoder.decodeBitmap(src,(decoder,info,source)->{decoder.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB));android.util.Size size=info.getSize();float factor=Math.min(1,Math.min(4096f/Math.max(size.getWidth(),size.getHeight()),(float)Math.sqrt(6000000d/((double)size.getWidth()*size.getHeight()))));decoder.setTargetSize(Math.max(1,Math.round(size.getWidth()*factor)),Math.max(1,Math.round(size.getHeight()*factor)));});
            handler.post(()->{if(destroyed)return;busy=false;demo=false;setImage(image);});
        }catch(Exception|OutOfMemoryError e){handler.post(()->{busy=false;message("사진을 열 수 없습니다","다른 사진을 선택해 주세요. 큰 사진은 최대 4096px로 불러옵니다.");});}});
    }
    private void loadDemo(){demo=true;setImage(demoImage());}
    private void setImage(Bitmap image){original=image;float scale=Math.min(1,1100f/Math.max(image.getWidth(),image.getHeight()));preview=Bitmap.createScaledBitmap(image,Math.max(1,Math.round(image.getWidth()*scale)),Math.max(1,Math.round(image.getHeight()*scale)),true);state=new State();undo.clear();redo.clear();editor();render();}
    private void remember(){undo.push(state.copy());redo.clear();while(undo.size()>30)undo.removeLast();updateUndo();}
    private void updateUndo(){if(undoButton!=null)undoButton.setAlpha(undo.isEmpty()?.35f:1);if(redoButton!=null)redoButton.setAlpha(redo.isEmpty()?.35f:1);}
    private void editor(){
        mount();LinearLayout head=row();TextView back=button("‹",false,()->confirmLeave());head.addView(back);
        TextView title=label("LUMI  /  EDIT",14,INK);title.setGravity(Gravity.CENTER);title.setLetterSpacing(.08f);head.addView(title,new LinearLayout.LayoutParams(0,dp(48),1));saveButton=button("저장 ↗",true,this::save);head.addView(saveButton);root.addView(head);gap(root,12);
        LinearLayout info=row();status=label(demo?"샘플 편집":"기기에서만 안전하게 편집",11,MUTED);info.addView(status,new LinearLayout.LayoutParams(0,dp(28),1));undoButton=label("↶ 되돌리기",11,INK);undoButton.setPadding(dp(8),0,0,0);undoButton.setOnClickListener(v->{if(!busy&&!undo.isEmpty()){redo.push(state.copy());state=undo.pop();updateUndo();controls();render();}});info.addView(undoButton);redoButton=label("↷ 다시",11,INK);redoButton.setPadding(dp(10),0,0,0);redoButton.setOnClickListener(v->{if(!busy&&!redo.isEmpty()){undo.push(state.copy());state=redo.pop();updateUndo();controls();render();}});info.addView(redoButton);root.addView(info);updateUndo();
        photo=new PhotoView();photo.image=preview;photo.setBackground(background(0xff171a18,20));root.addView(photo,new LinearLayout.LayoutParams(-1,0,1));gap(root,10);
        LinearLayout quick=row();TextView compare=new CompareButton();quick.addView(compare,new LinearLayout.LayoutParams(0,dp(44),1));TextView reset=button("초기화",false,()->{remember();state=new State();controls();render();});LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(dp(80),dp(44));rp.leftMargin=dp(8);quick.addView(reset,rp);root.addView(quick);gap(root,14);
        LinearLayout tabs=row();for(String name:new String[]{"보정","피부","필터","리터치","구성"}){TextView t=label(name,14,name.equals(tab)?ACCENT:MUTED);t.setGravity(Gravity.CENTER);t.setPadding(0,dp(12),0,dp(12));t.setOnClickListener(v->{tab=name;if(!tab.equals("리터치"))brush=0;for(int n=0;n<tabs.getChildCount();n++)((TextView)tabs.getChildAt(n)).setTextColor(((TextView)tabs.getChildAt(n)).getText().toString().equals(tab)?ACCENT:MUTED);controls();});tabs.addView(t,new LinearLayout.LayoutParams(0,dp(44),1));}root.addView(tabs);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);tools=column();scroll.addView(tools);root.addView(scroll,new LinearLayout.LayoutParams(-1,dp(190)));controls();
    }
    private interface Change {void set(float n);}
    private void slider(String name,float value,boolean bipolar,Change change){
        LinearLayout line=row();TextView caption=label(name,13,INK);line.addView(caption,new LinearLayout.LayoutParams(0,dp(28),1));TextView number=label(String.valueOf(Math.round(value*100)),12,ACCENT);line.addView(number);tools.addView(line);
        SeekBar seek=new SeekBar(this);seek.setMax(bipolar?200:100);seek.setProgress(Math.round(value*100)+(bipolar?100:0));seek.setProgressTintList(android.content.res.ColorStateList.valueOf(ACCENT));seek.setThumbTintList(android.content.res.ColorStateList.valueOf(ACCENT));tools.addView(seek,new LinearLayout.LayoutParams(-1,dp(34)));
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){public void onStartTrackingTouch(SeekBar b){remember();}public void onStopTrackingTouch(SeekBar b){render();}public void onProgressChanged(SeekBar b,int p,boolean user){if(!user||busy)return;float n=(p-(bipolar?100:0))/100f;change.set(n);number.setText(String.valueOf(Math.round(n*100)));scheduleRender();}});
    }
    private final Runnable delayedRender=()->render();
    private void scheduleRender(){handler.removeCallbacks(delayedRender);handler.postDelayed(delayedRender,90);}
    private void controls(){
        if(tools==null)return;tools.removeAllViews();
        switch(tab){
            case "보정": slider("밝기",state.s.exposure,true,n->state.s.exposure=n);slider("대비",state.s.contrast,true,n->state.s.contrast=n);slider("채도",state.s.saturation,true,n->state.s.saturation=n);slider("색온도",state.s.warmth,true,n->state.s.warmth=n);slider("하이라이트 복원",state.s.highlights,false,n->state.s.highlights=n);slider("비네트",state.s.vignette,false,n->state.s.vignette=n);break;
            case "피부":tools.addView(label("피부 결은 부드럽게, 윤곽은 또렷하게",14,INK));gap(tools,8);tools.addView(label("피부색 영역에 선택적으로 적용합니다.\n조명과 피부색에 따라 결과가 달라질 수 있습니다.",12,MUTED));gap(tools,16);slider("피부 매끄럽게",state.s.smooth,false,n->state.s.smooth=n);break;
            case "필터":LinearLayout filters=row();String[] names={"원본","선라이트","쿨 에어","필름","모노"};for(int i=0;i<names.length;i++){final int index=i;TextView f=button(names[i],state.s.filter==i,()->{remember();state.s.filter=index;controls();render();});LinearLayout.LayoutParams fp=new LinearLayout.LayoutParams(-2,dp(46));fp.rightMargin=dp(7);filters.addView(f,fp);}HorizontalScrollView hs=new HorizontalScrollView(this);hs.setHorizontalScrollBarEnabled(false);hs.addView(filters);tools.addView(hs);gap(tools,20);slider("필터 강도",state.s.filterAmount,false,n->state.s.filterAmount=n);break;
            case "리터치":
                LinearLayout brushes=row();String[] brushNames={"확대 / 이동","잡티 브러시","부분 형태"};for(int i=0;i<3;i++){final int choice=i;brushes.addView(button(brushNames[i],brush==i,()->{brush=choice;controls();}),new LinearLayout.LayoutParams(0,dp(44),1));}tools.addView(brushes);gap(tools,12);
                tools.addView(label(brush==1?"작은 잡티를 터치하면 주변 색으로 부드럽게 채웁니다.":brush==2?"바꾸고 싶은 부위를 조금씩 끌어 형태를 조절하세요.":"두 손가락으로 확대하고 사진을 이동하세요.",12,MUTED));gap(tools,8);slider("브러시 크기",(brushRadius-.015f)/.12f,false,n->brushRadius=.015f+n*.12f);break;
            case "구성":
                LinearLayout transforms=row();transforms.addView(button("↻ 회전",false,()->{remember();state.rotation=(state.rotation+90)%360;render();}),new LinearLayout.LayoutParams(0,dp(46),1));transforms.addView(button("⇄ 좌우 반전",state.flip,()->{remember();state.flip=!state.flip;controls();render();}),new LinearLayout.LayoutParams(0,dp(46),1));tools.addView(transforms);gap(tools,10);
                LinearLayout crops=row();String[] ratios={"전체","1:1","4:5","16:9"};for(int i=0;i<ratios.length;i++){final int c=i;crops.addView(button(ratios[i],state.crop==i,()->{remember();state.crop=c;controls();render();}),new LinearLayout.LayoutParams(0,dp(44),1));}tools.addView(crops);gap(tools,10);
                LinearLayout extra=row();extra.addView(button("문구 넣기",false,this::caption),new LinearLayout.LayoutParams(0,dp(44),1));extra.addView(button("화이트 프레임",state.frame,()->{remember();state.frame=!state.frame;controls();render();}),new LinearLayout.LayoutParams(0,dp(44),1));tools.addView(extra);break;
        }
    }
    private void caption(){EditText input=new EditText(this);input.setText(state.caption);input.setSingleLine(true);input.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(60)});new AlertDialog.Builder(this).setTitle("사진에 넣을 문구").setMessage("빈 문구를 적용하면 글자가 제거됩니다.").setView(input).setPositiveButton("적용",(d,w)->{remember();state.caption=input.getText().toString();render();}).setNegativeButton("취소",null).show();}
    private Bitmap geometry(Bitmap source,State st){
        Matrix m=new Matrix();m.postScale(st.flip?-1:1,1);m.postRotate(st.rotation);
        Bitmap b=Bitmap.createBitmap(source,0,0,source.getWidth(),source.getHeight(),m,true);
        if(st.crop!=0){float ratio=st.crop==1?1:st.crop==2?.8f:16f/9;int w=b.getWidth(),h=b.getHeight();if(w/(float)h>ratio)w=Math.round(h*ratio);else h=Math.round(w/ratio);b=Bitmap.createBitmap(b,(b.getWidth()-w)/2,(b.getHeight()-h)/2,w,h);}
        return b;
    }
    private Bitmap process(Bitmap source,State st){
        Bitmap edited=source;
        if(!st.edits.isEmpty()){int sw=source.getWidth(),sh=source.getHeight();int[] raw=new int[sw*sh];source.getPixels(raw,0,sw,0,0,sw,sh);edited=Bitmap.createBitmap(PhotoEngine.retouch(raw,sw,sh,st.edits),sw,sh,Bitmap.Config.ARGB_8888);}
        Bitmap geo=geometry(edited,st);int w=geo.getWidth(),h=geo.getHeight();int[] px=new int[w*h];geo.getPixels(px,0,w,0,0,w,h);int[] output=PhotoEngine.render(px,w,h,st.s);Bitmap result=Bitmap.createBitmap(output,w,h,Bitmap.Config.ARGB_8888);
        if(!st.caption.isEmpty()||st.frame){Canvas c=new Canvas(result);Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);if(st.frame){p.setStyle(Paint.Style.STROKE);p.setColor(Color.WHITE);p.setStrokeWidth(Math.min(w,h)*.045f);c.drawRect(0,0,w,h,p);p.setStyle(Paint.Style.FILL);}if(!st.caption.isEmpty()){p.setColor(Color.WHITE);p.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));p.setTextAlign(Paint.Align.CENTER);p.setTextSize(w*.045f);while(p.measureText(st.caption)>w*.85f)p.setTextSize(p.getTextSize()*.9f);p.setShadowLayer(w*.006f,0,w*.002f,0xaa000000);c.drawText(st.caption,w*.5f,h*.9f,p);}}
        return result;
    }
    private void render(){
        if(preview==null||destroyed)return;handler.removeCallbacks(delayedRender);if(renderTask!=null)renderTask.cancel(true);final int id=++generation;final State captured=state.copy();final Bitmap input=preview;
                status.setText("보정 중…");renderTask=worker.submit(()->{try{Bitmap b=process(input,captured);Bitmap comparison=geometry(input,captured);handler.post(()->{if(destroyed||id!=generation)return;rendered=b;photo.image=b;photo.originalImage=comparison;photo.geoState=captured;photo.invalidate();status.setText(getString(R.string.render_complete,original.getWidth(),original.getHeight()));});}catch(CancellationException ignored){}catch(Exception|OutOfMemoryError e){handler.post(()->{if(!destroyed&&id==generation){status.setText("보정 실패 · 강도를 낮추거나 작은 사진으로 재시도");}});}});
    }
    private void save(){
        if(original==null)return;busy=true;saveButton.setText("저장 중…");final State captured=state.copy();final Bitmap input=original;
        worker.submit(()->{Uri uri=null;try{
            Bitmap result=process(input,captured);ContentValues values=new ContentValues();values.put(MediaStore.Images.Media.DISPLAY_NAME,"LUMI_"+System.currentTimeMillis()+".jpg");values.put(MediaStore.Images.Media.MIME_TYPE,"image/jpeg");values.put(MediaStore.Images.Media.RELATIVE_PATH,"Pictures/LUMI");values.put(MediaStore.Images.Media.IS_PENDING,1);uri=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);if(uri==null)throw new IOException("MediaStore unavailable");try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null||!result.compress(Bitmap.CompressFormat.JPEG,97,out))throw new IOException("JPEG save failed");}values.clear();values.put(MediaStore.Images.Media.IS_PENDING,0);getContentResolver().update(uri,values,null,null);handler.post(()->{if(destroyed)return;busy=false;saveButton.setText("저장 ↗");message("갤러리에 저장했습니다","Pictures/LUMI 폴더에서 확인하세요. 워터마크 없이 JPEG 품질 97로 저장했습니다.");});
        }catch(Exception|OutOfMemoryError e){if(uri!=null)getContentResolver().delete(uri,null,null);handler.post(()->{if(destroyed)return;busy=false;saveButton.setText("저장 ↗");message("저장하지 못했습니다","기기 저장 공간을 확인하고 다시 시도해 주세요.");});}});
    }
    private void message(String title,String text){if(!destroyed)new AlertDialog.Builder(this).setTitle(title).setMessage(text).setPositiveButton("확인",null).show();}
    private void confirmLeave(){new AlertDialog.Builder(this).setTitle("편집을 종료할까요?").setMessage("저장하지 않은 변경 사항은 사라집니다.").setPositiveButton("종료",(d,w)->{generation++;if(renderTask!=null)renderTask.cancel(true);handler.removeCallbacks(delayedRender);original=null;preview=null;rendered=null;tools=null;photo=null;undoButton=null;home();}).setNegativeButton("계속 편집",null).show();}
    @Override public void onBackPressed(){if(busy)return;if(original!=null)confirmLeave();else super.onBackPressed();}
    @Override protected void onDestroy(){destroyed=true;handler.removeCallbacksAndMessages(null);worker.shutdownNow();super.onDestroy();}
    private Bitmap demoImage(){
        Bitmap b=Bitmap.createBitmap(900,1100,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(b);Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new LinearGradient(0,0,900,1100,new int[]{0xffb6c6b2,0xffe9dfc9,0xffbdb896},null,Shader.TileMode.CLAMP));c.drawRect(0,0,900,1100,p);p.setShader(null);
        p.setColor(0xffeceddc);c.drawCircle(655,270,150,p);p.setColor(0xff798973);c.drawOval(-200,600,1100,1600,p);
        p.setColor(0xff3a5644);c.drawOval(180,760,710,1320,p);p.setColor(0xffd9a781);c.drawRoundRect(390,630,500,840,45,45,p);
        p.setColor(0xff3e322b);c.drawOval(220,260,680,820,p);p.setColor(0xffe3b68f);c.drawOval(295,340,595,740,p);
        p.setColor(0xff43382e);c.drawArc(235,245,660,660,175,210,true,p);p.setColor(0xff5b4034);p.setStrokeWidth(9);c.drawLine(345,520,389,516,p);c.drawLine(495,516,539,520,p);p.setColor(0xffb77967);p.setStrokeWidth(7);c.drawLine(411,642,473,642,p);
        p.setColor(0xffefe9db);c.drawOval(70,930,335,1300,p);p.setColor(0xffced8b5);c.drawOval(710,680,1010,1400,p);return b;
    }
    private final class CompareButton extends TextView {
        private boolean touchClick;
        CompareButton(){super(MainActivity.this);setText("누르고 원본 보기");setTextSize(14);setTextColor(INK);setGravity(Gravity.CENTER);setTypeface(null,Typeface.BOLD);setPadding(dp(16),dp(12),dp(16),dp(12));setBackground(background(PANEL,18));setClickable(true);setContentDescription("원본 비교. 길게 누르거나 접근성 클릭으로 원본과 보정 사진을 전환합니다.");}
        @Override public boolean onTouchEvent(MotionEvent e){if(photo==null)return false;if(e.getAction()==MotionEvent.ACTION_DOWN){photo.before=true;photo.invalidate();return true;}if(e.getAction()==MotionEvent.ACTION_UP){photo.before=false;photo.invalidate();touchClick=true;performClick();touchClick=false;return true;}if(e.getAction()==MotionEvent.ACTION_CANCEL){photo.before=false;photo.invalidate();return true;}return true;}
        @Override public boolean performClick(){if(!touchClick&&photo!=null){photo.before=!photo.before;photo.invalidate();}super.performClick();return true;}
    }
    private final class PhotoView extends View {
        private final RectF drawRect=new RectF();
        Bitmap image,originalImage;State geoState=new State();boolean before=false,multiTouch=false,fill=false;float zoom=1,dx=0,dy=0,lastX,lastY,downX,downY;Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);ScaleGestureDetector detector;
        PhotoView(){super(MainActivity.this);setContentDescription("사진 미리보기. 두 손가락으로 확대하고 끌어서 이동할 수 있습니다.");detector=new ScaleGestureDetector(MainActivity.this,new ScaleGestureDetector.SimpleOnScaleGestureListener(){public boolean onScale(ScaleGestureDetector d){zoom=Math.max(1,Math.min(4,zoom*d.getScaleFactor()));if(zoom==1){dx=dy=0;}invalidate();return true;}});}
        @Override protected void onDraw(Canvas c){super.onDraw(c);Bitmap b=before&&originalImage!=null?originalImage:image;if(b==null)return;float sx=getWidth()/(float)b.getWidth(),sy=getHeight()/(float)b.getHeight(),scale=fill?Math.max(sx,sy):Math.min(sx,sy)*.94f;float w=b.getWidth()*scale,h=b.getHeight()*scale;c.save();c.clipRect(0,0,getWidth(),getHeight());c.translate(getWidth()/2f+dx,getHeight()/2f+dy);c.scale(zoom,zoom);drawRect.set(-w/2,-h/2,w/2,h/2);c.drawBitmap(b,null,drawRect,paint);c.restore();}
        private float[] sourcePoint(float tx,float ty){
            if(image==null||preview==null)return null;float scale=Math.min(getWidth()/(float)image.getWidth(),getHeight()/(float)image.getHeight())*.94f;
            float x=(tx-getWidth()/2f-dx)/zoom/scale+image.getWidth()/2f,y=(ty-getHeight()/2f-dy)/zoom/scale+image.getHeight()/2f;if(x<0||y<0||x>=image.getWidth()||y>=image.getHeight())return null;
            Matrix m=new Matrix();m.postScale(geoState.flip?-1:1,1);m.postRotate(geoState.rotation);RectF bounds=new RectF(0,0,preview.getWidth(),preview.getHeight());m.mapRect(bounds);m.postTranslate(-bounds.left,-bounds.top);
            if(geoState.crop!=0){x+=(bounds.width()-image.getWidth())/2;y+=(bounds.height()-image.getHeight())/2;}
            Matrix inverse=new Matrix();m.invert(inverse);float[] point={x,y};inverse.mapPoints(point);point[0]=Math.max(0,Math.min(1,point[0]/Math.max(1,preview.getWidth()-1)));point[1]=Math.max(0,Math.min(1,point[1]/Math.max(1,preview.getHeight()-1)));return point;
        }
        @Override public boolean onTouchEvent(MotionEvent e){
            detector.onTouchEvent(e);if(e.getActionMasked()==MotionEvent.ACTION_DOWN){lastX=downX=e.getX();lastY=downY=e.getY();multiTouch=false;return true;}
            if(e.getPointerCount()>1)multiTouch=true;
            if(e.getActionMasked()==MotionEvent.ACTION_MOVE&&!detector.isInProgress()&&zoom>1&&brush==0){dx+=e.getX()-lastX;dy+=e.getY()-lastY;dx=Math.max(-getWidth()*(zoom-1)/2,Math.min(getWidth()*(zoom-1)/2,dx));dy=Math.max(-getHeight()*(zoom-1)/2,Math.min(getHeight()*(zoom-1)/2,dy));invalidate();}
            lastX=e.getX();lastY=e.getY();if(e.getActionMasked()==MotionEvent.ACTION_UP){if(brush!=0&&!multiTouch&&!busy&&this==photo){if(state.edits.size()>=100){message("리터치 작업이 많습니다","이번 버전은 사진당 브러시 100회까지 지원합니다. 저장한 사진을 다시 열면 계속 편집할 수 있습니다.");}else{float[] start=sourcePoint(downX,downY),end=sourcePoint(e.getX(),e.getY());if(start!=null&&end!=null){remember();float mx=Math.max(-.08f,Math.min(.08f,end[0]-start[0])),my=Math.max(-.08f,Math.min(.08f,end[1]-start[1]));state.edits.add(new PhotoEngine.Retouch(brush==2,start[0],start[1],brushRadius,mx,my));render();}}}performClick();}return true;
        }
        @Override public boolean performClick(){super.performClick();return true;}
    }
}
