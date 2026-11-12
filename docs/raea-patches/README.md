# raea 로컬 패치

`live-frame-pacing.patch`: 게임 창이 쓸데없이 다시 그리던 걸 줄이는 raea 엔진 수정이에요. raea `0ea4eabe` 기준이고, 로컬 사본에만 적용돼 있어요(커밋 안 함).

- 창(`raea play`, 내보낸 앱)이 디스플레이 주사율마다가 아니라 게임 프레임 시각(초당 60번)에만 그려요. 창이 다른 창에 가려졌을 때 초당 약 1,700번씩 그리던 문제가 없어져요.
- 바뀐 게 없는 프레임(페이지 변경 0개, 애니메이션·영상·3D 없음)은 다시 그리지 않아요. 최소 4프레임에 한 번은 그려요.
- React가 프레임 표시 말고는 아무것도 바꾸지 않은 프레임은 페이지 요소 전체를 훑는 것도 건너뛰어요(`ReactEntities::page_ops`).
- 앱 자체 테스트의 "놓친 프레임"은 실제로 늦게 끝난 프레임만 세요.
- `RAEA_PAGE_OPS=1`: 프레임마다 페이지를 바꾼 변경을 출력해요(디버그용).

raea를 업데이트해서 수정이 사라지면 다시 적용하고 빌드해요.

```sh
cd <raea 레포>
git apply <tap-tap-pets>/docs/raea-patches/live-frame-pacing.patch
cargo build --release -p raea-cli
cargo build --profile game -p raea-app-game --bin raea-game --features player
```
