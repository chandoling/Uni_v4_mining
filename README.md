# CREATE2 채굴 가이드

---

## 1. Node.js 설치
- [Node.js 공식 웹사이트](https://nodejs.org/en)에서 다운로드 및 설치합니다.

---

## 2. Visual Studio Code 설치
- [Visual Studio Code 공식 웹사이트](https://code.visualstudio.com/)에서 다운로드 및 설치합니다.

---

## 3. 프로젝트 폴더 생성
1. Visual Studio Code를 열고, 원하는 위치에 새 폴더를 생성합니다.
2. 해당 폴더를 Visual Studio Code에서 열어주세요.

---

## 4. miner.js 파일 추가
1. 생성한 폴더 안에 `miner.js` 파일을 만듭니다.
2. 아래 제공된 코드를 `miner.js` 파일에 복사하여 붙여넣습니다.
3. `myAddress` 값을 본인의 지갑 주소(`0x...`)로 변경합니다.

```javascript
const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');

// 주어진 값들
const initCodeHash = '0x94d114296a5af85c1fd2dc039cdaa32f1ed4b0fe0868f02d888bfc91feb645d9';
const deployerAddress = '0x48E516B34A1274f49457b9C6182097796D0498Cb';
const myAddress = '본인지갑주소'; 

// CREATE2 주소 생성 함수
function computeCreate2Address(saltHex) {
  return ethers.getCreate2Address(
    deployerAddress,
    saltHex,
    initCodeHash
  );
}

// 점수 계산 함수
function calculateScore(address) {
  let score = 0;
  const addr = address.toLowerCase().replace(/^0x/, '');
  const nibbles = addr.split('');

  // 앞의 0 니블 개수 계산
  let leadingZeroNibbles = 0;
  for (let i = 0; i < nibbles.length; i++) {
    if (nibbles[i] === '0') {
      leadingZeroNibbles++;
    } else {
      break;
    }
  }
  score += leadingZeroNibbles * 10;

  // 유효성 검사: 첫 번째 0이 아닌 니블이 4여야 함
  if (nibbles[leadingZeroNibbles] !== '4') {
    return 0; // 유효하지 않음
  }

  // 주소가 4444로 시작하는지 확인
  if (addr.startsWith('0'.repeat(leadingZeroNibbles) + '4444')) {
    score += 40;

    // 그 다음 니블이 4가 아닌지 확인
    if (nibbles[leadingZeroNibbles + 4] !== '4') {
      score += 20;
    }
  }

  // 마지막 네 개 니블이 4인지 확인
  if (addr.endsWith('4444')) {
    score += 20;
  }

  // 주소 내의 모든 4에 대해 1점씩 추가
  for (let i = leadingZeroNibbles; i < nibbles.length; i++) {
    if (nibbles[i] === '4') {
      score += 1;
    }
  }

  return score;
}

// 채굴 시작
async function mine() {
  while (true) {
    // salt 생성 (첫 20바이트는 자신의 주소 또는 0으로 채움)
    const randomBytes = crypto.randomBytes(12); // 12바이트 (96비트)
    const saltBuffer = Buffer.concat([
      Buffer.from(myAddress.slice(2).padStart(40, '0'), 'hex'), // 첫 20바이트
      randomBytes // 마지막 12바이트
    ]);
    const saltHex = '0x' + saltBuffer.toString('hex');

    const address = computeCreate2Address(saltHex);
    const score = calculateScore(address);

    if (score >= 100) {
      const result = `Salt: ${saltHex}, Address: ${address}, Score: ${score}\n`;
      console.log(result);
      fs.appendFileSync('results.txt', result);
    }
  }
}

mine();
```

---

## 5. 의존성 설치
1. Visual Studio Code에서 **터미널 열기**: `Ctrl + Shift + \`` (백틱 키).
2. 아래 명령어를 입력하여 필요한 라이브러리를 설치합니다:
```bash
npm install ethers
```

---

## 6. 채굴 실행
1. 아래 명령어를 입력하여 채굴을 시작합니다:
```bash
node miner.js
```
2. 실행 중지: 채굴을 멈추려면 `Ctrl + C`를 눌러 중지합니다.

---

## 7. 고득점 설정
- 기본적으로 점수 100 이상을 채굴하도록 설정되어 있습니다.
- 더 높은 점수를 원한다면 `miner.js` 파일의 마지막 부분에서 아래 값을 변경합니다:
```javascript
if (score >= 110) {
```
→ 원하는 점수 기준으로 수정 후 저장하세요.

---

## 8. result.txt
- 결과값은 result.txt에 저장됩니다. 해당 값을 이더스캔 통해서 제출하시면 됩니다.

---

## 온체인 결과 입력

1. **이더스캔 Uni V4 컨트랙트 페이지로 이동**
   [컨트랙트 주소](https://etherscan.io/address/0x48e516b34a1274f49457b9c6182097796d0498cb)

2. **`Write Contract` 탭 열기**
   → `updateBestAddress` 함수를 선택합니다.

3. **채굴한 `salt` 값 입력**
   → `salt` 값은 채굴 중 출력된 값을 사용합니다.

4. **오류 무시하고 진행**
   → 트랜잭션 오류가 발생하더라도 메타마스크 기준 "계속 진행"을 클릭하세요.

5. **수수료 편집 (고급 설정)**
   - **가스 한도**: 200,000으로 설정.
   - **최대 기본 요금**: 현재 Gwei 값을 검색 후 입력.

6. **트랜잭션 컨펌**
   → 가스비를 편집한 후 확인 버튼을 눌러 트랜잭션을 전송합니다.

---

## 9. 트랜잭션 결과 확인
1. 트랜잭션이 성공하면 아래와 같은 오류 메시지가 출력될 수 있습니다:
   ```
   Fail with Custom Error 'WorseAddress (newAddress=0x00444453501C41bB8C4D3ABc8df0BABA841E233D, bestAddress=0x000000000044449b4...)'
   ```
2. 이는 정상적인 메시지로, 최고 점수를 달성하지 못했지만 점수는 등록된 상태입니다!

---

## TIP
- **점수를 올리고 싶다면**:
  - `miner.js` 파일에서 기준 점수를 높게 설정하세요.
  - 더 많은 시간과 계산을 통해 높은 점수의 주소를 찾을 확률을 증가시킬 수 있습니다.
