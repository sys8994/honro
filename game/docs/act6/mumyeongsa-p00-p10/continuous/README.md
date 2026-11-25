# 일반 쉼터에서 시작한 6막 연속 플레이

일반 쉼터에서 6-1을 연 다음 같은 Chromium 탭에서 실제 키와 버튼으로 진행한다. 새 컨텍스트는 방금 작성된 경계를 다시 열어 비교하는 용도로만 사용한다. 진행 중인 탭의 기록은 갈아끼우지 않는다.

첫 PC 판은 51→52→53→54→55를 이어갔다. 각 실제 경계를 검증하고 원래 일반 저장도 바이트 단위로 비교했다. 53과 54의 실제 혼 O06, B와 C를 통과했다. 55에서는 온전한 결속 전략을 시도했으나 실제 피격으로 결속이 약화됐다. 해당 전략의 검수를 실패로 남겼다. 이어가는 새 판은 복구 전략을 쓴다. [첫 판 로그](intact-first.json) · [실제 실패 화면](intact-bell.webp)

```bash
npm run build
python game/docs/act6/mumyeongsa-p00-p10/baseline/continuous.py --build "$PWD" --out /tmp/honro-act6-intact --engage-bell
python game/docs/act6/mumyeongsa-p00-p10/baseline/continuous.py --build "$PWD" --out /tmp/honro-act6-repair --engage-bell --bell-case repair
```
