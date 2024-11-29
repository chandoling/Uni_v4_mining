const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');

// 주어진 값들
const initCodeHash = '0x94d114296a5af85c1fd2dc039cdaa32f1ed4b0fe0868f02d888bfc91feb645d9';
const deployerAddress = '0x48E516B34A1274f49457b9C6182097796D0498Cb';
const myAddress = '본인 지갑 주소'; 

// CREATE2 주소 생성 함수
function computeCreate2Address(saltHex) {
  return ethers.getCreate2Address(
    deployerAddress,
    saltHex,
    initCodeHash
  );
}

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
