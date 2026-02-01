import { DiagramData } from "./types";

export const DEFAULT_DIAGRAM: DiagramData = {
  actors: [
    { id: 'user', name: 'User' },
    { id: 'client', name: 'Client' },
    { id: 'server', name: 'Server' },
    { id: 'db', name: 'Database' }
  ],
  messages: [
    { id: 'm1', sourceId: 'user', targetId: 'client', label: 'Click Login', order: 0 },
    { id: 'm2', sourceId: 'client', targetId: 'server', label: 'POST /auth/login', order: 1 },
    { id: 'm3', sourceId: 'server', targetId: 'db', label: 'Query User', order: 2 },
    { id: 'm4', sourceId: 'db', targetId: 'server', label: 'Return User Data', order: 3 },
    { id: 'm5', sourceId: 'server', targetId: 'client', label: '200 OK (Token)', order: 4 },
    { id: 'm6', sourceId: 'client', targetId: 'user', label: 'Show Homepage', order: 5 }
  ]
};

export const DEFAULT_DIAGRAM_ZH: DiagramData = {
  actors: [
    { id: 'user', name: '用户' },
    { id: 'client', name: '客户端' },
    { id: 'server', name: '服务端' },
    { id: 'db', name: '数据库' }
  ],
  messages: [
    { id: 'm1', sourceId: 'user', targetId: 'client', label: '点击登录', order: 0 },
    { id: 'm2', sourceId: 'client', targetId: 'server', label: 'POST /auth/login', order: 1 },
    { id: 'm3', sourceId: 'server', targetId: 'db', label: '查询用户', order: 2 },
    { id: 'm4', sourceId: 'db', targetId: 'server', label: '返回用户数据', order: 3 },
    { id: 'm5', sourceId: 'server', targetId: 'client', label: '200 OK (Token)', order: 4 },
    { id: 'm6', sourceId: 'client', targetId: 'user', label: '展示首页', order: 5 }
  ]
};

export const SAMPLE_PROMPTS = [
  "User login, system verifies password, database returns user info, system generates token, user navigates to homepage.",
  "Order flow: User submits order -> API checks inventory -> Payment gateway charges -> Database stores order -> Email service sends confirmation."
];

export const SAMPLE_PROMPTS_ZH = [
  "用户登录，系统验证密码，数据库返回用户信息，系统生成 token，用户跳转首页。",
  "下单流程：用户提交订单 -> API 校验库存 -> 支付网关扣款 -> 数据库存储订单 -> 邮件服务发送确认。"
];

