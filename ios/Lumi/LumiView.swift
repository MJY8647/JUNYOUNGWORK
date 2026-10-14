import SwiftUI

@MainActor struct LumiView: View {
    @StateObject private var model = PhotoModel()
    @State private var picker = false
    @State private var pickerKind = 0
    @State private var collageLayout = 0
    @State private var chooseCollage = false
    @State private var videoURL: URL?
    @State private var tab = "보정"
    @State private var compare = false
    @State private var brushMode = 0
    @State private var brushSize = 0.05
    @State private var captionSheet = false
    @State private var caption = ""
    @State private var confirmClose = false
    private let demo = ImagePipeline.demo()

    var body: some View {
        ZStack {
            LumiTheme.background.ignoresSafeArea()
            if model.original == nil { home } else { editor }
            if model.busy {
                Color.black.opacity(0.4).ignoresSafeArea()
                ProgressView(model.original == nil ? "불러오는 중…" : "처리 중…")
                    .padding(28).background(LumiTheme.panel).clipShape(RoundedRectangle(cornerRadius: 22))
            }
        }
        .tint(LumiTheme.accent)
        .sheet(isPresented: $picker) {
            PhotoPicker(presented: $picker, video: pickerKind == 2, multiple: pickerKind == 1,
                onBegin: { model.busy = true },
                onImages: { images in
                    if pickerKind == 1 { model.collage(images, layout: collageLayout) }
                    else if let image = images.first { model.load(image) }
                    else { model.busy = false }
                }, onVideo: { url in model.busy = false; videoURL = url },
                onError: { error in model.busy = false; model.message = error.localizedDescription })
        }
        .sheet(isPresented: Binding(get: { videoURL != nil }, set: { if !$0 { videoURL = nil } })) {
            if let url = videoURL { VideoEditor(url: url) }
        }
        .confirmationDialog("콜라주 레이아웃", isPresented: $chooseCollage, titleVisibility: .visible) {
            ForEach(Array(["정사각 그리드", "세로 스트립", "가로 스트립"].enumerated()), id: \.offset) { index, name in
                Button(name) { collageLayout = index; openPicker(1) }
            }
        }
        .alert("LUMI", isPresented: Binding(get: { model.message != nil }, set: { if !$0 { model.message = nil } })) {
            Button("확인") { model.message = nil }
        } message: { Text(model.message ?? "") }
        .alert("편집을 종료할까요?", isPresented: $confirmClose) {
            Button("계속 편집", role: .cancel) {}
            Button("종료", role: .destructive) { model.close() }
        } message: { Text("저장하지 않은 변경 사항은 사라집니다.") }
        .sheet(isPresented: $captionSheet) {
            NavigationStack {
                Form { TextField("사진에 넣을 문구", text: $caption).onChange(of: caption) { caption = String($0.prefix(60)) } }
                    .navigationTitle("문구 넣기").navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) { Button("취소") { captionSheet = false } }
                        ToolbarItem(placement: .confirmationAction) { Button("적용") { model.change { $0.caption = caption }; captionSheet = false } }
                    }
            }.presentationDetents([.medium])
        }
    }
    private func openPicker(_ kind: Int) { pickerKind = kind; picker = true }
    private var home: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("LUMI").font(.system(size: 26, weight: .bold)).tracking(5)
                        Spacer(); Text("PHOTO STUDIO").font(.system(size: 10)).foregroundColor(LumiTheme.accent)
                    }.padding(.bottom, 4)
                    Text("YOUR LIGHT, YOUR LOOK").font(.system(size: 11)).tracking(2).foregroundColor(LumiTheme.accent)
                    Text("당신의 순간을,\n더 당신답게.").font(.system(size: 30, weight: .bold))
                    Text("자연스러운 보정부터 나만의 색감까지").font(.system(size: 13)).foregroundColor(LumiTheme.muted)
                    Image(uiImage: demo).resizable().scaledToFill()
                        .frame(height: max(150, min(280, geometry.size.height - 410))).clipped()
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                    Text("색감 편집 데모 · 실제 인물 사진이 아닙니다").font(.system(size: 10)).foregroundColor(LumiTheme.muted)
                    Button { openPicker(0) } label: { Label("내 사진으로 시작", systemImage: "plus").frame(maxWidth: .infinity) }
                        .buttonStyle(LumiButton(primary: true)).accessibilityIdentifier("pickPhoto")
                    HStack {
                        Button("샘플 둘러보기") { model.load(demo) }.frame(maxWidth: .infinity).accessibilityIdentifier("demoPhoto")
                        Button("콜라주 만들기") { chooseCollage = true }.frame(maxWidth: .infinity)
                    }.buttonStyle(LumiButton())
                    Button { openPicker(2) } label: { Text("영상 자르기 / 음소거").frame(maxWidth: .infinity) }.buttonStyle(LumiButton())
                    Text("모든 기능 무료 · 워터마크 없음 · 기기 내 처리")
                        .font(.system(size: 10)).foregroundColor(LumiTheme.muted).frame(maxWidth: .infinity)
                }.foregroundColor(LumiTheme.ink).padding(20)
            }
        }
    }
    private var editor: some View {
        VStack(spacing: 12) {
            HStack {
                Button { confirmClose = true } label: { Image(systemName: "chevron.left") }.buttonStyle(LumiButton()).accessibilityLabel("편집 종료")
                Spacer(); Text("LUMI / EDIT").font(.system(size: 14)).tracking(2); Spacer()
                Button("저장 ↗") { model.save() }.buttonStyle(LumiButton(primary: true)).accessibilityIdentifier("savePhoto")
            }
            HStack(spacing: 12) {
                Text(model.status).font(.system(size: 11)).foregroundColor(LumiTheme.muted).lineLimit(1)
                Spacer()
                Button { model.undo() } label: { Image(systemName: "arrow.uturn.backward") }.disabled(model.history.isEmpty).accessibilityLabel("되돌리기")
                Button { model.redo() } label: { Image(systemName: "arrow.uturn.forward") }.disabled(model.future.isEmpty).accessibilityLabel("다시 실행")
            }.frame(minHeight: 30)
            PhotoCanvas(image: compare ? model.comparison : model.preview, brushMode: brushMode,
                enabled: !model.busy && !model.rendering,
                onStroke: { a, b in model.brush(from: a, to: b, reshape: brushMode == 2, radius: Float(brushSize)) })
                .background(LumiTheme.panel).clipShape(RoundedRectangle(cornerRadius: 22))
                .frame(maxHeight: .infinity)
            HStack {
                Text("누르고 원본 보기").font(.system(size: 14, weight: .semibold)).frame(maxWidth: .infinity, minHeight: 46)
                    .background(LumiTheme.panel).clipShape(RoundedRectangle(cornerRadius: 18))
                    .gesture(DragGesture(minimumDistance: 0).onChanged { _ in compare = true }.onEnded { _ in compare = false })
                    .accessibilityAddTraits(.isButton).accessibilityAction { compare.toggle() }
                Button("초기화") { model.change { $0 = PhotoState() } }.buttonStyle(LumiButton())
            }
            HStack(spacing: 0) {
                ForEach(["보정", "피부", "필터", "리터치", "구성"], id: \.self) { name in
                    Button(name) { tab = name; if name != "리터치" { brushMode = 0 } }
                        .font(.system(size: 14, weight: .medium)).foregroundColor(tab == name ? LumiTheme.accent : LumiTheme.muted)
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
            }
            ScrollView { controls.padding(.vertical, 4) }.frame(height: 180)
        }.padding(.horizontal, 20).padding(.vertical, 12).foregroundColor(LumiTheme.ink).disabled(model.busy)
    }
    private func slider(_ name: String, _ path: WritableKeyPath<PixelSettings, Float>, bipolar: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack { Text(name); Spacer(); Text("\(Int((model.state.pixels[keyPath: path] * 100).rounded()))").foregroundColor(LumiTheme.accent) }.font(.system(size: 13))
            Slider(value: Binding(get: { Double(model.state.pixels[keyPath: path]) }, set: {
                model.state.pixels[keyPath: path] = Float($0); model.scheduleRender()
            }), in: bipolar ? -1...1 : 0...1, step: 0.01, onEditingChanged: { editing in
                if editing { model.remember() } else { model.render() }
            }).accessibilityLabel(name)
        }
    }
    @ViewBuilder private var controls: some View {
        switch tab {
        case "보정":
            VStack(spacing: 12) {
                slider("밝기", \.exposure); slider("대비", \.contrast); slider("채도", \.saturation)
                slider("색온도", \.warmth); slider("하이라이트 조절", \.highlights, bipolar: false)
                slider("비네트", \.vignette, bipolar: false)
            }
        case "피부":
            VStack(alignment: .leading, spacing: 14) {
                Text("피부 결은 부드럽게, 윤곽은 또렷하게").font(.system(size: 14))
                Text("피부색 영역에 선택적으로 적용합니다. 조명과 피부색에 따라 결과가 달라질 수 있습니다.").font(.system(size: 12)).foregroundColor(LumiTheme.muted)
                slider("피부 매끄럽게", \.smooth, bipolar: false)
            }
        case "필터":
            VStack(spacing: 20) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack { ForEach(Array(["원본", "선라이트", "쿨 에어", "필름", "모노"].enumerated()), id: \.offset) { index, name in
                        Button(name) { model.change { $0.pixels.filter = index } }.buttonStyle(LumiButton(primary: model.state.pixels.filter == index))
                    } }
                }
                slider("필터 강도", \.filterAmount, bipolar: false)
            }
        case "리터치":
            VStack(spacing: 14) {
                HStack { ForEach(Array(["확대/이동", "잡티", "부분 형태"].enumerated()), id: \.offset) { index, name in
                    Button(name) { brushMode = index }.buttonStyle(LumiButton(primary: brushMode == index))
                } }
                Text(brushMode == 1 ? "작은 잡티를 터치해 주변 색으로 채웁니다." : brushMode == 2 ? "바꾸고 싶은 부위를 조금씩 끌어 조절하세요." : "두 손가락으로 확대하고 사진을 이동하세요.")
                    .font(.system(size: 12)).foregroundColor(LumiTheme.muted)
                HStack { Text("브러시 크기").font(.system(size: 13)); Slider(value: $brushSize, in: 0.015...0.135) }
            }
        default:
            VStack(spacing: 10) {
                HStack {
                    Button("↻ 회전") { model.change { $0.turns = ($0.turns + 1) % 4 } }.buttonStyle(LumiButton())
                    Button("⇄ 좌우 반전") { model.change { $0.flipped.toggle() } }.buttonStyle(LumiButton(primary: model.state.flipped))
                }
                HStack { ForEach(Array(["전체", "1:1", "4:5", "16:9"].enumerated()), id: \.offset) { index, name in
                    Button(name) { model.change { $0.crop = index } }.buttonStyle(LumiButton(primary: model.state.crop == index))
                } }
                HStack {
                    Button("문구 넣기") { caption = model.state.caption; captionSheet = true }.buttonStyle(LumiButton())
                    Button("화이트 프레임") { model.change { $0.frame.toggle() } }.buttonStyle(LumiButton(primary: model.state.frame))
                }
            }
        }
    }
}

struct PhotoCanvas: View {
    let image: UIImage?
    let brushMode: Int
    let enabled: Bool
    let onStroke: (CGPoint, CGPoint) -> Void
    @State private var zoom: CGFloat = 1
    @State private var zoomBase: CGFloat = 1
    @State private var offset = CGSize.zero
    @State private var offsetBase = CGSize.zero
    @State private var pinching = false

    var body: some View {
        GeometryReader { geometry in
            if let image = image {
                canvas(image, container: geometry.size)
            }
        }
    }

    private func canvas(_ image: UIImage, container: CGSize) -> some View {
        let fit = min(container.width / image.size.width, container.height / image.size.height) * 0.94
        let size = CGSize(width: image.size.width * fit, height: image.size.height * fit)
        return ZStack {
            Image(uiImage: image).resizable().frame(width: size.width, height: size.height)
                .scaleEffect(zoom).offset(offset)
        }
        .frame(width: container.width, height: container.height)
        .contentShape(Rectangle()).clipped()
        .gesture(dragGesture(container: container, size: size))
        .simultaneousGesture(magnificationGesture)
        .accessibilityLabel("사진 미리보기. 두 손가락으로 확대하고 이동할 수 있습니다.")
    }

    private func dragGesture(container: CGSize, size: CGSize) -> some Gesture {
        DragGesture(minimumDistance: brushMode == 0 ? 1 : 0)
            .onChanged { value in
                if brushMode == 0 && !pinching {
                    let x = offsetBase.width + value.translation.width
                    let y = offsetBase.height + value.translation.height
                    let limitX = size.width * (zoom - 1) / 2
                    let limitY = size.height * (zoom - 1) / 2
                    offset = CGSize(width: max(-limitX, min(limitX, x)),
                                    height: max(-limitY, min(limitY, y)))
                }
            }
            .onEnded { value in
                if brushMode == 0 { offsetBase = offset }
                else if enabled && !pinching,
                        let a = point(value.startLocation, container: container, image: size),
                        let b = point(value.location, container: container, image: size) { onStroke(a, b) }
            }
    }

    private var magnificationGesture: some Gesture {
        MagnificationGesture().onChanged { value in
            pinching = true
            zoom = max(1, min(4, zoomBase * value))
        }.onEnded { _ in
            zoomBase = zoom
            if zoom == 1 { offset = .zero; offsetBase = .zero }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { pinching = false }
        }
    }
    private func point(_ p: CGPoint, container: CGSize, image: CGSize) -> CGPoint? {
        let x = ((p.x - container.width / 2 - offset.width) / zoom + image.width / 2) / image.width
        let y = ((p.y - container.height / 2 - offset.height) / zoom + image.height / 2) / image.height
        guard x >= 0, x <= 1, y >= 0, y <= 1 else { return nil }
        return CGPoint(x: x, y: y)
    }
}
