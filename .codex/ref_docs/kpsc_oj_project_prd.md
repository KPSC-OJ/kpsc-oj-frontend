# KPSC Online Judge - Product Requirements Document (PRD)

## 1. 개요

KPSC Online Judge는 국민대학교 학생들을 위한 내부 알고리즘 문제 풀이 플랫폼이다.
문제 풀이, 자동 채점, 랭킹 및 티어 시스템을 제공한다.

## 2. 목표

* 내부 학생 대상 PS 플랫폼 제공
* 백준과 유사한 문제 풀이 경험 제공
* 학습 동기 부여를 위한 티어 시스템 구축

## 3. 사용자

* 일반 사용자: 문제 풀이
* 출제자: 문제 생성
* 관리자: 유저 및 문제 관리

## 4. 핵심 기능

* 문제 목록 / 상세 조회
* 코드 제출 및 채점
* 제출 기록 관리
* 티어 시스템
* 문제 난이도 시스템

## 5. 인증 정책

* @kookmin.ac.kr 이메일만 가입 가능
* 관리자 승인 후 사용 가능

## 6. 시스템 구성

Frontend (Next.js)
Backend (Spring Boot)
Judge (DMOJ)

## 7. 아키텍처

Frontend → Backend → Judge (DMOJ)

## 8. MVP 범위

* 문제 풀이
* 제출 및 채점
* 유저 시스템
* 티어 시스템

## 9. 제외 기능

* 대회 시스템
* 팀전
* AI 분석

## 10. 확장 계획

* 대회 기능
* AI 코드 리뷰
* 문제 추천 시스템
