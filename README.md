#### contract PlayDuzzle
- function
  - 시즌 시작
    - 시즌 시작할때 재료 관련해서 파라미터를 어떻게 넘겨야하는지
      -> 기존에 있는 재료토큰의 주소[] + 기존에 있는 재료토큰의 발행 제한 개수 []
      -> 새로 발행할 재료토큰의 이름[] + 새로 발행할 재료토큰의 심볼[] + 새로 발행할 재료토큰의 발행 제한 개수[]
      -> 퍼즐피스 구분하는 구간과 구간별 재료정보
      -> 설계도면 구분하는 구간

  - 재료아이템 발행
    - DAL을 차감한다 (없으면 자동으로 revert됨)
    - 랜덤을 뽑아서 설계도면, 일반재료 중에 하나를 고른다 (랜덤은 블록해시를 계속 해시)
      - 설계도면일 경우
        - 남은 설계도면 목록을 뽑아서 거기중에서 하나 랜덤으로 준다
        - 설계도면 array에서 발행한 토큰은 true(minted)로 바꿔준다
      - 일반재료일 경우
        - 한번 더 랜덤 뽑아서 어떤 재료 줄껀지 결정한다
        - 발행하고 현재 발행개수 올려준다.

  - 퍼즐피스 발행
    - 파라미터로 tokenId가 넘어올 것임 (이미 민트됐는지는 확인할 필요X)
    - 토큰아이디의 구간을 파악한다.
    - 그 구간에서 필요한 재료를 파악한다
    - msg.sender가 그 재료를 다 가지고 있는지 확인한다.
    - 문제 없으면 재료를 소각한다
    - mint(tokenId) 호출한다.
- 변수
  - 현재 시즌 number (시즌마다 ++)
  - mapping (시즌 number -> 시즌 정보)

시즌정보
  - mapping (address(재료 주소) -> 재료의 최대 발행 개수) // 요거 이상으론 발행 불가
  - mapping (address(재료 주소) -> 재료의 현재 발행 개수) // 발행 할때마다 하나씩 증가

  - 설계도면 array[](100) // 민트 여부 확인용
  - 재료 목록 (address[])
  - 퍼즐피스 구간 및 구간별 재료정보
  - 설계도면 구간

  - 조회용도로 퍼즐피스의 (최대 발행, 현재 발행) 저장해놔도 괜찮음.


ERC721
- 퍼즐 피스, 설계 도면은 mint할 때 tokenId를 받아서 해야한다. 메타데이터는 각 토큰별로 디비에 미리 만들어놓는다
- 일반 재료는 토큰아이디가 그냥 순차적으로 증가하면 된다. 그리고 메타데이터는 전부 동일하다



동시성 이슈

A가 여러번 호출하는거
-> 처음 호출된것만 처리된다.
-> 나중에 호출된건 에러 발생(재료가 없어서)

A가 호출했는데 B가 또 호출하는거
-> 먼저 호출한 사람이 됨
-> 토큰 아이디는 고유하기때문에 erc721에서 에러가 난다.(재료가 다 있더라도)


# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

