完成总结
Refresh Token 功能之前的问题：TokenRefreshService 已实现但从未被任何代码调用，属于"死代码"。
本次修复
1. 新增 TokenRefreshFilter
   注册到 Spring Security 过滤器链（在 OAuth2 login 过滤器之后）
   每个已认证请求都会触发：调用 OAuth2AuthorizedClientManager.authorize()，该方法内部自动检测 token 是否过期，若过期则使用 refresh_token 刷新
   刷新后的 token 保存在 Spring Security 的 OAuth2AuthorizedClientRepository 中
2. 更新 GatewayFilter
   从 OAuth2AuthorizedClientService（只读，不刷新）改为 OAuth2AuthorizedClientManager（自动刷新）
   转发请求到后端服务时，保证携带最新的 access token
3. 更新 UserInfoService
   同样改用 OAuth2AuthorizedClientManager，调用 eIDP userinfo 前自动刷新 token
4. 更新 SecurityConfig
   注册 TokenRefreshFilter 到过滤器链
   Token 刷新流程
5. 请求 → Spring Security OAuth2 认证 → TokenRefreshFilter（自动刷新过期 token）
   → GatewayFilter / UserInfoService（使用最新 token）
   OAuth2AuthorizedClientManager 配置了 .refreshToken() provider，当 access token 过期或即将过期时，自动使用 refresh token 向 eIDP 申请新的 access token。