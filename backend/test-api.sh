#!/bin/bash

# API Testing Script
BASE_URL="http://localhost:3001/api"
TOKEN=""

echo "🧪 Testing LMS Platform API"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$HEALTH" | jq .
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH"
    exit 1
fi
echo ""

# Test Register
echo -e "${YELLOW}2. Testing Register...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "STUDENT"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Register successful${NC}"
    echo "$REGISTER_RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠ Register failed (might already exist)${NC}"
    echo "$REGISTER_RESPONSE" | jq .
fi
echo ""

# Test Login
echo -e "${YELLOW}3. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
    echo "Token: ${TOKEN:0:50}..."
    echo "$LOGIN_RESPONSE" | jq '.data.user'
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test Get Me
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}4. Testing Get Current User...${NC}"
    ME_RESPONSE=$(curl -s "$BASE_URL/auth/me" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Get me successful${NC}"
        echo "$ME_RESPONSE" | jq .
    else
        echo -e "${RED}✗ Get me failed${NC}"
        echo "$ME_RESPONSE" | jq .
    fi
    echo ""

    # Test Get Courses
    echo -e "${YELLOW}5. Testing Get Courses...${NC}"
    COURSES_RESPONSE=$(curl -s "$BASE_URL/courses" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$COURSES_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Get courses successful${NC}"
        echo "$COURSES_RESPONSE" | jq '.data | length' | xargs echo "Courses count:"
    else
        echo -e "${RED}✗ Get courses failed${NC}"
        echo "$COURSES_RESPONSE" | jq .
    fi
    echo ""

    # Test Get Users
    echo -e "${YELLOW}6. Testing Get Users...${NC}"
    USERS_RESPONSE=$(curl -s "$BASE_URL/users" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$USERS_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Get users successful${NC}"
        echo "$USERS_RESPONSE" | jq '.data | length' | xargs echo "Users count:"
    else
        echo -e "${RED}✗ Get users failed${NC}"
        echo "$USERS_RESPONSE" | jq .
    fi
    echo ""

    # Test Get Live Sessions
    echo -e "${YELLOW}7. Testing Get Live Sessions...${NC}"
    LIVE_SESSIONS_RESPONSE=$(curl -s "$BASE_URL/live-sessions" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$LIVE_SESSIONS_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Get live sessions successful${NC}"
        echo "$LIVE_SESSIONS_RESPONSE" | jq '.data | length' | xargs echo "Live sessions count:"
    else
        echo -e "${RED}✗ Get live sessions failed${NC}"
        echo "$LIVE_SESSIONS_RESPONSE" | jq .
    fi
    echo ""

    # Test Get Grading Tasks
    echo -e "${YELLOW}8. Testing Get Grading Tasks...${NC}"
    GRADING_RESPONSE=$(curl -s "$BASE_URL/grading/tasks" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$GRADING_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Get grading tasks successful${NC}"
        echo "$GRADING_RESPONSE" | jq '.data | length' | xargs echo "Grading tasks count:"
    else
        echo -e "${YELLOW}⚠ Get grading tasks (might be empty or not a teacher)${NC}"
        echo "$GRADING_RESPONSE" | jq .
    fi
    echo ""
fi

echo -e "${GREEN}✅ API Testing Complete!${NC}"


