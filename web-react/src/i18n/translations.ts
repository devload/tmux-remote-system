export type Language = 'ko' | 'en';

export const translations = {
  ko: {
    // Onboarding
    welcome: 'SessionCast에 오신 것을 환영합니다',
    noMachines: '아직 연결된 머신이 없습니다. 아래 단계를 따라 시작하세요.',

    // AI Install
    aiInstallTitle: 'AI로 자동 설치',
    aiInstallDesc: '아래 프롬프트를 복사하여 AI 도구에 붙여넣으면 자동으로 설치해줍니다.',
    copyPrompt: '프롬프트 복사',
    compatibleWith: '호환 도구:',
    orManualInstall: '또는 직접 설치',

    // Prerequisites
    prerequisitesTitle: '사전 요구사항',
    prerequisitesDesc: '시작하기 전에 다음 프로그램들이 설치되어 있어야 합니다.',
    ifNotInstalled: '미설치 시',
    required: '필수',
    wslNote: 'Windows에서는 WSL2가 필요합니다. 설치 후 Ubuntu를 실행하세요.',
    verifyInstall: '설치 확인:',

    // Setup steps
    step1Title: 'Host Agent 설치',
    step1Desc: '제어하려는 머신에서 agent를 클론하고 빌드하세요:',

    step2Title: '설정 파일 생성',
    step2Desc: '아래 내용으로 설정 파일을 생성하세요:',
    yourAgentToken: 'Agent 토큰:',
    yourRelayUrl: '나의 Relay URL:',
    copyToken: '토큰 복사',
    copy: '복사',
    copied: '복사됨!',

    step3Title: 'tmux 세션 생성',
    step3Desc: '최소 하나의 tmux 세션이 실행 중이어야 합니다:',

    step4Title: 'Agent 실행',
    step4Desc: 'Agent를 실행하여 머신을 연결하세요:',
    step4Hint: 'Agent가 자동으로 모든 tmux 세션을 감지합니다.',
    runInBackground: '백그라운드 실행 (선택사항):',

    // Footer
    footerConnected: '연결되면 사이드바에 세션이 표시됩니다.',
    footerSecurity: '본인 토큰으로 등록된 세션만 볼 수 있습니다.',

    // Session list
    sessions: '세션',
    noSessions: '세션 없음',

    // Token manager
    agentTokens: 'Agent 토큰',
    tokenDescription: 'Agent 토큰을 생성하여 ~/.tmux-remote.yml 설정에 추가하세요. 본인 토큰으로 등록된 세션만 볼 수 있습니다.',
    generateNewToken: '새 토큰 생성',
    generating: '생성 중...',
    yourTokens: '내 토큰',
    noTokensYet: '토큰이 없습니다. 새로 생성하세요.',
    newTokenWarning: '새 토큰 (지금 복사하세요, 다시 표시되지 않습니다):',
    revoke: '폐기',
    configExample: '설정 예시',
    tokenRevoked: '토큰이 폐기되었습니다',
    tokenNotFound: '토큰을 찾을 수 없거나 소유하지 않습니다',

    // Login
    loginTitle: 'SessionCast',
    loginSubtitle: '어디서나 터미널에 접속하세요',
    loginTagline: '원격 터미널 세션 공유 플랫폼',
    loginWithGoogle: 'Google로 로그인',
    domainNotAllowed: '허용되지 않은 도메인입니다',
    loginFailed: '로그인 실패. 다시 시도해주세요.',

    // Features
    featureSecure: '안전한 연결',
    featureSecureDesc: 'E2E 암호화로 보호',
    featureRealtime: '실시간 공유',
    featureRealtimeDesc: '지연 없는 터미널 스트리밍',
    featureMulti: '멀티 세션',
    featureMultiDesc: '여러 세션 동시 관리',

    // Announcements
    announcement: '공지사항',
    announcementBeta: '베타 서비스 오픈!',
    announcementBetaDesc: 'SessionCast 베타 서비스가 시작되었습니다. 피드백을 환영합니다.',

    // Terminal
    selectSession: '사이드바에서 세션을 선택하세요',
    offline: '오프라인',
    connecting: '연결 중...',

    // General
    loading: '로딩 중...',
    error: '오류',
    close: '닫기',
  },

  en: {
    // Onboarding
    welcome: 'Welcome to SessionCast',
    noMachines: 'No connected machines yet. Follow the steps below to get started.',

    // AI Install
    aiInstallTitle: 'Auto-Install with AI',
    aiInstallDesc: 'Copy the prompt below and paste it into your AI tool for automatic installation.',
    copyPrompt: 'Copy Prompt',
    compatibleWith: 'Works with:',
    orManualInstall: 'or install manually',

    // Prerequisites
    prerequisitesTitle: 'Prerequisites',
    prerequisitesDesc: 'Make sure you have the following installed before starting.',
    ifNotInstalled: 'if not installed',
    required: 'Required',
    wslNote: 'Windows requires WSL2. After installation, run Ubuntu.',
    verifyInstall: 'Verify installation:',

    // Setup steps
    step1Title: 'Install the Host Agent',
    step1Desc: 'On the machine you want to control, clone and build the agent:',

    step2Title: 'Create Configuration File',
    step2Desc: 'Create the config file with your agent token:',
    yourAgentToken: 'Your Agent Token:',
    yourRelayUrl: 'Your Relay URL:',
    copyToken: 'Copy Token',
    copy: 'Copy',
    copied: 'Copied!',

    step3Title: 'Create a tmux Session',
    step3Desc: 'Make sure you have at least one tmux session running:',

    step4Title: 'Start the Agent',
    step4Desc: 'Run the agent to connect your machine:',
    step4Hint: 'The agent will automatically discover all your tmux sessions.',
    runInBackground: 'Run in background (optional):',

    // Footer
    footerConnected: 'Once connected, your sessions will appear in the sidebar.',
    footerSecurity: 'Only sessions registered with your token will be visible to you.',

    // Session list
    sessions: 'Sessions',
    noSessions: 'No sessions',

    // Token manager
    agentTokens: 'Agent Tokens',
    tokenDescription: 'Generate an agent token and add it to your ~/.tmux-remote.yml config. Only you will be able to see sessions registered with your token.',
    generateNewToken: 'Generate New Token',
    generating: 'Generating...',
    yourTokens: 'Your Tokens',
    noTokensYet: 'No tokens yet. Generate one to get started.',
    newTokenWarning: 'New Token (copy now, won\'t be shown again):',
    revoke: 'Revoke',
    configExample: 'Config Example',
    tokenRevoked: 'Token revoked successfully',
    tokenNotFound: 'Token not found or not owned by you',

    // Login
    loginTitle: 'SessionCast',
    loginSubtitle: 'Access your terminals from anywhere',
    loginTagline: 'Remote Terminal Session Sharing Platform',
    loginWithGoogle: 'Sign in with Google',
    domainNotAllowed: 'Domain not allowed',
    loginFailed: 'Login failed. Please try again.',

    // Features
    featureSecure: 'Secure Connection',
    featureSecureDesc: 'E2E encrypted',
    featureRealtime: 'Real-time Sharing',
    featureRealtimeDesc: 'Zero-latency streaming',
    featureMulti: 'Multi Session',
    featureMultiDesc: 'Manage multiple sessions',

    // Announcements
    announcement: 'Announcements',
    announcementBeta: 'Beta Service Launch!',
    announcementBetaDesc: 'SessionCast beta is now live. We welcome your feedback.',

    // Terminal
    selectSession: 'Select a session from the sidebar',
    offline: 'Offline',
    connecting: 'Connecting...',

    // General
    loading: 'Loading...',
    error: 'Error',
    close: 'Close',
  }
};

export type TranslationKey = keyof typeof translations.ko;
