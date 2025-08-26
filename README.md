# 📌 산돌이 Repository Template  

## 📂 개요  
산돌이 챗봇 중 디스코드 챗봇을 담당하는 서비스 입니다.

---

## 📌 프로젝트 구조  
- Node.js
  - discord.js

---

## 📌 문서  
- [챗봇 명령어 목록 (Notion)](https://dandelion-savory-5fa.notion.site/25b8dd10578380ba93bec6684ca360e1?v=25b8dd105783800a8421000c730699af)

---

## 📌 환경 설정  
- **모든 서비스는 Docker 기반으로 실행되므로, 로컬 환경에 별도로 의존하지 않음**  
- **환경 변수 파일 (`.env`) 필요 시, 샘플 파일 (`.env.example`) 제공**  
- **Docker Compose를 통해 서비스 간 네트워크 및 볼륨을 설정**  
- **프론트엔드 서비스(챗봇 서버, 웹 서비스)와 백엔드 서비스(API 서버)의 차이점을 반영하여 개별 실행 가능**  

### 📌 실행 방법  
#### 1. 기본 실행 (모든 서비스 실행)  
```bash
docker compose up -d
```
#### 2. 특정 서비스만 실행 (예: 챗봇 서버)  
```bash
docker compose up -d <서비스명>
```
#### 3. 서비스 중지  
```bash
docker compose down
```
#### 4. 환경 변수 변경 후 재시작  
```bash
docker compose up -d --build
```

---

## 📌 배포 가이드  
- .env
  - 봇 Token과 Application ID를 입력하지 않을 시 오류가 발생할 수 있습니다.
  - USE_BOT=FALSE 로 봇 사용을 비활성화해야 합니다.
---

## 📌 문의  
- [챗봇/디스코드-챗봇](https://discord.com/channels/1339452791071969331/1339456614947754004)

---
🚀 **산돌이 프로젝트와 함께 효율적인 개발 환경을 만들어갑시다!**  
