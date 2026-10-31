import type { ChatEvent, Component, History, Job, Plan, ProductDetail, Settings } from './api'
export const isDemo = import.meta.env.VITE_ENGINE !== '1'
export const sampleDescriptions:Record<string,string> = {
 'shop-assistant':'为独立店主打造的智能客服，解答商品问题，让每一次沟通都更有温度。',
 'research-assistant':'读懂论文，提炼观点。让散落的知识，成为有迹可循的研究洞察。',
 'meeting-assistant':'从会议录音到清晰纪要，自动整理关键决策与待办，让协作更高效。'
}
export const componentCatalog = [
 ['Agent 循环','行动','驱动模型观察、思考、调用工具，直到完成任务。'],['工具系统','行动','把业务操作封装成可调用、可校验的工具。'],['权限系统','约束','敏感操作先确认，明确每一次行动的边界。'],['钩子系统','约束','在工具执行前后进行审核、拦截和记录。'],['任务规划','认知','拆解复杂目标，让多步骤工作有序推进。'],['子 Agent','上下文','隔离子任务上下文，汇总结果后继续主线。'],['技能加载','认知','需要时再加载领域知识，保持上下文轻量。'],['上下文压缩','上下文','保留重要决定，压缩长对话中的历史噪声。'],['记忆系统','认知','跨会话保存偏好与决策，记住真正重要的事。'],['任务系统','协作','持久保存任务、依赖和状态，支持中断续跑。'],['后台任务','协作','慢操作异步处理，完成后主动通知。'],['定时调度','协作','按约定时间触发任务，支持持久化和幂等。'],['Agent 团队','协作','多个智能体分工合作，协调任务与工作区。'],['MCP 插件','行动','通过标准协议发现并接入外部工具。'],['集成 Harness','运行时','让工具、权限、记忆等机制在同一循环中协同。'],['工作流运行时','运行时','用明确的步骤组织固定流程，并记录执行轨迹。'],['目标闭环','认知','独立判断结果是否达标，决定继续还是交还用户。']
]
const KEY='xuguang:workspace:v1';const now=()=>Date.now()/1000
const date=()=>new Date().toLocaleDateString('sv-SE')
type RecordProduct=ProductDetail & {idea:string;history:History;docs:Record<string,string>}
type Store={products:RecordProduct[];jobs:Record<string,Job>;provider:string;model:string}
export function makePlan(name:string,idea:string,count=3):Plan {
 const synopsis=idea.split('\n').find(line=>line.trim()&&!line.startsWith('#')&&!line.startsWith('>'))?.trim()||idea
 const questions=['这个产品第一版优先服务哪一类用户？','遇到无法确定的请求时，希望转给人工，还是先澄清问题？','你希望用什么标准判断一次任务是否成功？'].slice(0,count)
 const components:Component[]=componentCatalog.map(([name,domain,one_liner],i)=>({id:`s${String(i+1).padStart(2,'0')}`,name,domain,one_liner,when:one_liner,feature:one_liner,decision:i<5||i===14?'必选':i===8||i===7?'二期':i===6&&count?'待确认':'放弃',reason:i<5||i===14?'示例选型：用于完成基础对话、工具调用、权限控制与任务闭环。':i===8||i===7?'第一版先验证核心体验，跨会话能力留待后续迭代。':i===6&&count?'需要进一步确认知识来源与更新方式。':'示例第一版未涉及此能力，保持架构精简。'}))
 return {title:name,one_liner:synopsis,runner:'mock',unknowns:questions,questions:questions.map((text,i)=>({text,original:text,priority:i===0?1:2})),dev_items:[{text:'接入真实业务工具后，需要补充鉴权、错误重试和调用日志。',original:'业务接口接入策略'}],facts:[{key:'goal',label:'产品目标',value:synopsis,status:'明确'},{key:'users',label:'目标用户',value:count?'待确认目标用户与使用场景':'个人研究者与知识工作者',status:count?'待确认':'明确'},{key:'loop',label:'核心闭环',value:'用户提出需求 → 澄清 → 查询资料 → 组织结果 → 用户确认',status:'明确'},{key:'output',label:'交付物',value:'结构化答案与可追溯的执行记录',status:'明确'},{key:'boundary',label:'安全边界',value:'不擅自执行敏感操作，信息不足时先确认',status:'明确'},{key:'constraints',label:'约束条件',value:'第一版聚焦单用户、同步对话',status:count?'待确认':'明确'}],elements:[{key:'tools',label:'工具',items:['知识检索','人工转接','结果整理']},{key:'knowledge',label:'知识',items:['业务文档','常见问题','服务规则']},{key:'observation',label:'观察',items:['工具返回结果','用户确认状态']},{key:'action',label:'行动',items:['检索资料','生成答复']},{key:'permission',label:'权限',items:['只读查询直接执行','外部写入需确认']}],components,layers:[['①','交互层','用户如何使用？','Web 对话界面，支持追问、反馈与结果确认'],['②','产品层','产品外壳是什么？','会话管理、请求路由与产品配置'],['③','Agent 编排层','任务如何推进？','Agent Loop → 工具调度 → 权限检查 → 结果回传'],['④','模型层','智能从哪里来？','可配置的大语言模型，失败时明确返回错误'],['⑤','能力集成层','如何连接外部世界？','知识检索工具、业务 API、人工转接'],['⑥','数据层','保存什么信息？','会话记录、任务状态与操作审计'],['⑦','基础设施层','如何部署运行？','本地 Python 引擎与 Web 前端，配置与密钥仅留在服务端']].map(([num,name,question,detail])=>({num,name,question,detail})),tool_list:[{name:'search_knowledge',input:'问题、检索条件',output:'匹配资料与来源',side_effect:'无，只读',permission:'allow',layer:'⑤'},{name:'ask_owner',input:'问题与上下文',output:'人工确认结果',side_effect:'通知负责人',permission:'ask',layer:'⑤'},{name:'delete_records',input:'记录标识',output:'拒绝执行',side_effect:'破坏性操作',permission:'deny',layer:'⑤'}],system_prompt:`你是「${name}」的 AI 助手。\n\n目标\n${idea}\n\n工作原则\n1. 先理解用户的真实需求，信息不足时主动澄清。\n2. 回答必须基于可追溯的业务资料，不编造事实。\n3. 外部通知、数据修改等操作必须获得明确确认。\n4. 工具失败时说明原因，提供人工处理路径。\n5. 完成后简洁说明结果及下一步。\n\n注意：这是一份前端演示草案，接入引擎后由模型生成正式方案。`,context_memory_strategy:'第一版只保留会话内上下文；长对话按需摘要。跨会话记忆作为二期能力，需用户明确授权。',security_and_degradation:['读取资料限定在授权范围内。','外部写入和通知先请求人工确认。','禁止删除业务记录。','模型或工具失败时，告知原因并保留人工处理入口。'],observability:{logs:['请求标识','工具调用','审批结果'],metrics:['任务完成率','响应时延','调用成本'],trajectory:'按会话记录推导、调用、结果与人工确认。'},tech_stack_and_deployment:'React + TypeScript 前端，连接 SpecFlow Engine。前端体验模式使用浏览器本地示例数据。',testing:['正常问题能够返回结构化答案。','资料不足时主动澄清，不编造结论。','敏感操作停在人工确认步骤。','禁止操作被明确拦截。'],review:{ok:count===0,score:count===0?92:84,summary:count?'示例审稿：核心闭环清晰，建议在开发前明确目标用户、降级方式和验收指标。':'示例审稿：主要需求已确认，可以进入开发交接。',issues:count?[{section:'需求边界',problem:'目标用户和成功标准仍需确认。',severity:'medium'}]:[]},design_attempts:1,budget:{calls:0,input_tokens:0,output_tokens:0}}
}
const prdText=(p:RecordProduct)=>`# ${p.name} · PRD V${p.version}\n\n> 前端体验数据，不是模型正式推导结果。\n\n## 产品目标\n${p.idea}\n\n## 需求拆解\n${p.plan?.facts.map(f=>`- ${f.label}：${f.value}`).join('\n')}\n\n## 待确认问题\n${p.plan?.unknowns.map(q=>`- ${q}`).join('\n')||'无'}\n`
function product(name:string,slug:string,idea:string,count:number,ago=0):RecordProduct{
 const zero={calls:0,input_tokens:0,output_tokens:0};const p:RecordProduct={name,slug,idea,version:1,has_plan:true,unknowns:count,review_ok:!count,pending_versions:[],updated:now()-ago,path:'浏览器本地工作空间',plan:makePlan(name,idea,count),job:null,answer_intro:`我们一起完善「${name}」的方案。\n\n${makePlan(name,idea,count).unknowns[0]??'所有问题已确认。'}`,usage:{total:zero,plan:zero,chat:zero},history:{current:1,versions:[{version:1,date:date(),change:'建立产品，生成第一版方案',source:'示例数据'}],log:[{date:date(),version:1,title:'建立工作区',lines:[`原始需求：${idea}`]}],snapshots:[]},docs:{}};p.docs['1']=prdText(p);return p
}
function toyProduct():RecordProduct {
 const idea='面向家长：拍一张玩具合影，一键得到一段可以亲子一起演的剧情脚本（具体痛点与成功标准待确认）。'
 const p=product('玩具合影剧本','toy-theater',idea,3)
 const questions=[
 '产品要达成什么？用一句话说清目标，以及怎样算做成（有没有可量化的成功标准）？',
 '除了家长，是否也给幼儿园老师、亲戚等其他人用？大致使用频率是多少，交互是同步等待还是异步拿结果？',
 '剧本以什么形式输出（纯文本、图片还是卡片）？长度、角色数量有要求吗？生成之后能不能修改？',
 '需要接哪些外部系统或资料（用哪个模型、是否需要素材库或玩具识别能力等）？',
 '除了照片，孩子的其他信息（年龄、姓名等）能否收集或留存？生成剧本是否需要输入孩子年龄、想演几分钟，还是完全由 AI 自己决定？',
 '「不许存照片」具体怎么实现：照片处理完立刻删除，还是只在内存中过一遍？还有哪些绝对不能做的事（不让孩子露脸、不公开分享等）？',
 '生成失败或照片处理出错时怎么办（重试、降级提示，还是直接报错）？',
 '怎样算成功？请给出可度量指标，如生成成功率、端到端时延、单次成本、家长可读性与满意率。',
 '第一版主要面向哪个年龄段的孩子？',
 '一张照片最多识别多少件玩具？',
 '遇到无法识别的玩具时，需要家长手动补充名称吗？',
 '是否需要固定的剧情结构或角色分配？',
 '亲子共演时，家长和孩子分别扮演什么角色？',
 '是否需要对故事主题和内容做适龄检查？',
 '哪些敏感主题或情节必须避免？',
 '是否支持保存已经生成的文本剧本？',
 '是否需要导出或打印剧本？',
 '是否允许重写某个片段，而不是重新生成完整故事？',
 '领域知识来自哪里，是否有自己的故事素材或教育规则？',
 '将来是否需要记住孩子的偏好？',
 '第一版的交互入口是网页、小程序，还是手机应用？',
 ]
 const plan=p.plan!
 plan.unknowns=questions;plan.questions=questions.map(text=>({text,original:text,priority:2}));plan.dev_items=[]
 plan.components=plan.components.map((c,i)=>({...c,decision:i<3?'必选':i===6?'待确认':'放弃',reason:i<3?'第一版需要完成图片理解、工具调用与照片隐私权限控制。':i===6?'需要确认是否有领域资料、故事素材与适龄规则。':'第一版暂不涉及此机制，避免过度设计。'}))
 plan.facts=[
 {key:'goal',label:'目标',value:'家长拍一张玩具合影，AI 生成一段可以亲子一起演的剧情脚本；「怎样算做成」与可量化的成功标准输入中未提供，待确认。',status:'待确认'},
 {key:'users',label:'用户',value:'家长（拍完玩具合影陪孩子一起演）；是否也给幼儿园老师、亲戚等其他人用、使用频率、同步还是异步交互，输入尚未回答。',status:'待确认'},
 {key:'loop',label:'核心闭环',value:'家长拍玩具合影 → 中间不设选择环节，一键直接生成 → 得到一段亲子可一起演的剧情脚本；生成后能否修改未提及。',status:'明确'},
 {key:'output',label:'交付物',value:'亲子共同演绎的剧情脚本。输出形式、时长和角色数量待确认。',status:'待确认'},
 {key:'boundary',label:'安全边界',value:'照片涉及隐私，默认不保存。不公开孩子信息，危险情节与适龄规则待确认。',status:'明确'},
 {key:'constraints',label:'约束',value:'第一版聚焦一次输入、一次生成。性能和单次成本预算待确认。',status:'待确认'}]
 plan.tool_list=[
 {name:'inspect_photo',input:'玩具合影',output:'画面质量与隐私检查',side_effect:'读取照片，不保存',permission:'allow',layer:'⑤'},
 {name:'identify_toys',input:'已检查的合影',output:'玩具与角色列表',side_effect:'调用视觉模型',permission:'allow',layer:'⑤'},
 {name:'load_story_rules',input:'目标年龄、场景',output:'适龄规则与故事结构',side_effect:'只读资料',permission:'allow',layer:'⑤'},
 {name:'compose_script',input:'角色、时长、约束',output:'剧情脚本草案',side_effect:'调用文本模型',permission:'allow',layer:'③'},
 {name:'review_script',input:'脚本草案',output:'适龄检查与修改建议',side_effect:'只读检查',permission:'allow',layer:'③'},
 {name:'export_script',input:'确认后的文本',output:'可下载的剧本',side_effect:'生成导出文件',permission:'ask',layer:'②'},
 {name:'publish_photo',input:'原始照片',output:'禁止执行',side_effect:'向外公开私人照片',permission:'deny',layer:'⑤'}]
 plan.review={ok:false,score:74,summary:'示例审稿：核心想法明确，但输出形态、隐私处理、适龄边界和验收标准仍需补充。',issues:['产品成功标准尚不明确','目标年龄范围未确认','剧本长度和输出形态未确认','照片处理和销毁方式待确认','适龄内容审核规则缺失','失败时的降级路径待确认','端到端时延和成本预算未定义'].map(problem=>({section:'需求与边界',problem,severity:'medium'}))}
 plan.design_attempts=2;p.unknowns=21;p.answer_intro='我们先把关键问题逐个确认。'+questions[0];p.docs['1']=prdText(p)
 return p
}
function seed():Store{return{products:[toyProduct()],jobs:{},provider:'deepseek',model:'deepseek-v4-flash'}}

let memory:Store|undefined
function read():Store{if(memory)return memory;try{const saved=localStorage.getItem(KEY);if(saved){const value=JSON.parse(saved);if(Array.isArray(value.products)&&value.jobs){if(!value.layoutV2){if(!value.products.some((p:RecordProduct)=>p.slug==='toy-theater'))value.products.unshift(toyProduct());value.layoutV2=true;try{localStorage.setItem(KEY,JSON.stringify(value))}catch{/* Keep in-memory migration if storage is unavailable. */}}memory=value;return value}}}catch{/* Storage unavailable: keep session state. */}memory=seed();return memory}
function save(){try{localStorage.setItem(KEY,JSON.stringify(read()))}catch{/* Browser may disallow persistent storage. */}}
const providers=[{key:'deepseek',name:'DeepSeek',model:'deepseek-v4-flash',key_page:'https://platform.deepseek.com'},{key:'anthropic',name:'Anthropic',model:'claude-sonnet-4-6',key_page:'https://console.anthropic.com'},{key:'zhipu',name:'智谱 GLM',model:'glm-5.2',key_page:'https://open.bigmodel.cn'},{key:'kimi',name:'Kimi',model:'kimi-k2.7-code',key_page:'https://platform.moonshot.cn'},{key:'minimax',name:'MiniMax',model:'MiniMax-M3',key_page:'https://platform.minimaxi.com'}]
const stages=['① 需求拆解','② 领域建模','③ 组件选型','④ 架构设计','⑤ 独立审稿','⑥ 整理待确认问题','⑦ 整理需求文档']
function createJob(p:RecordProduct,kind:string,result?:Job['result']){const job:Job={id:crypto.randomUUID(),slug:p.slug,kind,status:'running',started:now(),finished:null,logs:['▶ ① 需求拆解'],log_count:1,error:'',result};p.job=job;read().jobs[job.id]=job;save();return job}
function refreshJob(job:Job){const steps=Math.min(7,Math.floor((now()-job.started)/.55)+1);job.logs=stages.slice(0,steps).map(s=>'▶ '+s);job.log_count=steps;if(steps===7){job.status='done';job.finished=now()}save();return job}
// Typed adapter: the production request and NDJSON contracts stay unchanged.
export async function demoRequest<T>(path:string,body?:unknown,method?:'POST'|'DELETE'):Promise<T>{
 const s=read();const url=new URL(path,location.origin);const parts=url.pathname.split('/').filter(Boolean).map(decodeURIComponent);const b=(body??{}) as Record<string,unknown>;let result:unknown
 if(parts[1]==='settings'){
  if(body){s.provider=String(b.provider);s.model=String(b.model);save();result={ok:true,message:'演示偏好已保存（未连接模型，也未保存 API Key）'}}else result={mock:true,configured:true,provider:s.provider,model:s.model,key_masked:'',providers} satisfies Settings
 }else if(parts[1]==='jobs'){const j=s.jobs[parts[2]];if(!j)throw new Error('找不到这个推导任务');result=refreshJob(j)
 }else if(parts[1]==='products'&&!parts[2]){
  if(body){const name=String(b.name??'').trim();const idea=String(b.idea??'').trim();if(!name||!idea)throw new Error('产品名称和需求不能为空');const p=product(name,'product-'+crypto.randomUUID().slice(0,8),idea,3);s.products.unshift(p);result={slug:p.slug,job:createJob(p,'plan')};save()}else result={products:s.products}
 }else if(parts[1]==='products'&&parts[2]&&!parts[3]&&method==='DELETE'){
 const index=s.products.findIndex(p=>p.slug===parts[2]);if(index<0)throw new Error('找不到这个产品，请返回工作台。');s.products.splice(index,1);save();result={ok:true}
 }else {
 const p=s.products.find(p=>p.slug===parts[2]);if(!p)throw new Error('找不到这个产品，请返回工作台。')
 const action=parts[3]
 if(!action){if(p.job)refreshJob(p.job);result=p}
 else if(action==='history')result=p.history
 else if(action==='prd'){const v=Number(url.searchParams.get('v')||p.version);if(!p.docs[String(v)])throw new Error('找不到此版本快照');result={version:v,text:p.docs[String(v)],current:v===p.version}}
 else if(action==='plan')result={job:createJob(p,'plan')}
 else if(action==='reveal')throw new Error('体验版数据保存在浏览器中；连接本地引擎后可以打开产品文件夹。')
 else if(action==='play-intro')result={role:'产品使用者',scenarios:['我想了解你能做什么','请帮我处理一个需要人工确认的请求','请删除所有业务记录'],text:`欢迎体验「${p.name}」。\n\n你现在扮演产品使用者，可以直接提问，也可以测试人工确认和禁止操作的边界。\n\n当前是前端示例对话，所有工具结果均为模拟。`,fingerprint:p.slug+':'+p.version+':'+p.unknowns}
 else if(action==='answers'){
 const answers=b.answers as {question:string;answer:string}[];const completed=answers.filter(a=>a.answer!=='跳过这题');p.plan!.unknowns=p.plan!.unknowns.filter(q=>!completed.some(a=>a.question===q));p.plan!.questions=p.plan!.questions.filter(q=>!completed.some(a=>a.question===q.text));p.unknowns=p.plan!.unknowns.length;p.review_ok=p.unknowns===0;p.plan!.review.ok=p.review_ok;if(p.review_ok){p.plan!.review.summary='示例审稿：主要需求已确认，可以进入开发交接。';p.plan!.review.issues=[];p.plan!.review.score=92}for(const a of completed){if(a.question.includes('用户')){const f=p.plan!.facts.find(f=>f.key==='users');if(f){f.value=a.answer;f.status='明确'}}}p.idea+='\n\n已确认：\n'+answers.map(a=>`${a.question}\n${a.answer}`).join('\n');p.answer_intro=p.plan!.unknowns[0]||'问题已确认';p.updated=now();p.docs[String(p.version)]=prdText(p);p.history.log.push({date:date(),version:p.version,title:'回答待确认问题',lines:[`回答了 ${completed.length} 个问题`]});result={job:createJob(p,'answers')};save()
 }else if(action==='revise'){
 const old=p.version;p.docs[String(old)]=prdText(p);p.version++;p.idea+='\n\n新增需求：'+String(b.requirement);p.plan=makePlan(p.name,p.idea,2);p.unknowns=2;p.review_ok=false;p.updated=now();p.history.current=p.version;p.history.snapshots.push(old);p.history.versions.push({version:p.version,date:date(),change:String(b.title),source:'用户新增需求'});p.history.log.push({date:date(),version:p.version,title:'新需求',lines:[`新需求：${b.requirement}`,`PRD：V${old} → V${p.version}`,'选型变化：无']});p.docs[String(p.version)]=prdText(p);result={job:createJob(p,'revise',{old_version:old,new_version:p.version,diff:[]})};save()
 }else throw new Error('体验模式暂不支持此操作')
 }
 return structuredClone(result) as T
}
export async function* demoChat(endpoint:string,messages:{role:string;text:string}[],signal:AbortSignal):AsyncGenerator<ChatEvent>{
 const users=messages.filter(m=>m.role==='user');const last=users.at(-1)?.text??'';const parts=endpoint.split('/').filter(Boolean).map(decodeURIComponent);const p=read().products.find(p=>p.slug===parts[2]);const events:ChatEvent[]=[]
 const say=(delta:string)=>events.push({type:'text',delta});const suggest=(items:string[])=>events.push({type:'suggestions',items})
 if(endpoint==='/api/chat/intake'){
  if(users.length===1){say(`收到，你的想法是：\n\n> ${last}\n\n我们先聚焦第一版。这个产品主要给谁使用？一次使用后，你希望用户拿到什么结果？`);suggest(['给个人用户，拿到一份可以直接使用的结果','给小团队，减少重复工作','暂时不确定，帮我想想'])}
  else if(users.length===2){say('接下来确定边界：它有哪些绝对不能做的事？例如不能直接发消息、不能修改数据，或者涉及敏感操作必须先征求同意。');suggest(['外部操作前都需要我确认','只读资料，不修改或删除数据','先按最小权限设计'])}
  else{say('已把你的想法整理成需求草稿。你可以修改产品名和内容，再开始体验方案推导。');events.push({type:'tool',name:'confirm_product',args:{name:users[0].text.slice(0,12).replace(/[，。！？\n]/g,'')||'我的新产品',idea:`## 产品想法\n${users[0].text}\n\n## 用户与交付\n${users[1].text}\n\n## 安全边界\n${users.slice(2).map(m=>m.text).join('\n')}\n\n> 前端体验草稿，正式方案需连接 SpecFlow Engine 推导。`}})}
 }else if(endpoint.endsWith('/revise-chat')){
  say('已整理这次新增需求。确认后会保留旧版 PRD，并创建新版本。');events.push({type:'tool',name:'confirm_revision',args:{title:last.slice(0,35),requirement:last}})
 }else if(endpoint.endsWith('/chat')&&p){
  const qs=p.plan!.unknowns;const actual=users.filter(m=>m.text!=='帮我想想');const idx=actual.length
  if(last==='帮我想想'){say('你可以从这三个方向选择：\n\n- 先聚焦个人用户，减少复杂协作。\n- 面向小团队，把人工确认留给负责人。\n- 先做一个高频场景，跑通后再扩展。\n\n哪个更符合你的想法？');suggest(['先聚焦个人用户','面向小团队','先跑通一个高频场景'])}
  else if(idx<qs.length){say(`已记下：${last}\n\n${qs[idx]}`);suggest(['需要时转交人工处理','以结果准确、可追溯为标准','跳过这题'])}
  else {say('回答已整理好。请检查后保存，方案会同步更新。');events.push({type:'tool',name:'confirm_answers',args:{answers:qs.map((question,i)=>({question,answer:actual[i]?.text??'跳过这题'}))}})}
 }else if(endpoint.endsWith('/play')&&p){
  if(/删除|清空/.test(last)){events.push({type:'data',name:'play_step',data:{kind:'blocked',rule:'禁止删除业务记录；此操作没有执行。',wire:'按规则阻止删除'}});say('这个操作超出了允许的权限范围，我不能删除业务记录。可以帮你查询或整理已有资料。')}
  else if(/人工|发送|退款|通知|确认/.test(last)){events.push({type:'data',name:'play_step',data:{kind:'ask_owner',who:'负责人',action:'这项操作涉及外部动作，需要负责人确认。当前未执行。',wire:'等待人工确认，未执行'}});say('我已停在人工确认步骤。演示模式不会发送通知或执行真实业务操作。')}
  else{events.push({type:'data',name:'play_step',data:{kind:'tool',tool:'search_knowledge',input:last,result:'示例资料：匹配到产品介绍、服务规则与常见问题。',wire:'示例知识检索完成'}});say(`在「${p.name}」的示例场景中，我会先核实你的需求，再查询相关业务资料，给出清晰的处理建议。\n\n你刚才问的是「${last}」。真实回复需要接入模型与业务知识库；当前展示的是前端交互流程。`)}
  events.push({type:'data',name:'play_feedback',data:{}});suggest(['请帮我处理一个需要人工确认的请求','请删除所有业务记录'])
 }
 for(const event of events){if(signal.aborted)return;await new Promise(r=>setTimeout(r,170));if(signal.aborted)return;yield event}yield{type:'done'}
}
// ZIP (stored method): a self-contained demo handoff with an explicit provenance notice.
function zip(files:Record<string,string>):Blob{const enc=new TextEncoder();const chunks:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;let count=0;const header=(n:number)=>new Uint8Array(n);const u16=(a:Uint8Array,o:number,n:number)=>new DataView(a.buffer).setUint16(o,n,true);const u32=(a:Uint8Array,o:number,n:number)=>new DataView(a.buffer).setUint32(o,n>>>0,true);for(const[name,text]of Object.entries(files)){const n=enc.encode(name),data=enc.encode(text);let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;const local=header(30);u32(local,0,0x04034b50);u16(local,4,20);u16(local,6,0x800);u32(local,14,crc);u32(local,18,data.length);u32(local,22,data.length);u16(local,26,n.length);chunks.push(local,n,data);const c=header(46);u32(c,0,0x02014b50);u16(c,4,20);u16(c,6,20);u16(c,8,0x800);u32(c,16,crc);u32(c,20,data.length);u32(c,24,data.length);u16(c,28,n.length);u32(c,42,offset);central.push(c,n);offset+=30+n.length+data.length;count++}const len=central.reduce((a,b)=>a+b.length,0);const end=header(22);u32(end,0,0x06054b50);u16(end,8,count);u16(end,10,count);u32(end,12,len);u32(end,16,offset);return new Blob([...chunks,...central,end] as BlobPart[],{type:'application/zip'})}
const urls=new Map<string,string>()
export function demoHandoff(slug:string){const p=read().products.find(p=>p.slug===slug);if(!p)return'#';const key=`${slug}:${p.updated}`;if(urls.has(key))return urls.get(key)!;const plan=p.plan!;const blob=zip({'交接说明.md':`# ${p.name} · 前端演示交接包\n\n这是演示数据，不含真实推导结果或组件参考代码。正式交接包请连接SpecFlow Engine后重新导出。\n\n`,'PRD.md':prdText(p),'方案.md':`# ${p.name} · 示例方案\n\n${plan.one_liner}\n\n## 架构\n${plan.layers.map(l=>`### ${l.num} ${l.name}\n${l.detail}`).join('\n\n')}\n\n## 组件\n${plan.components.map(c=>`- ${c.id} ${c.name}：${c.decision}。${c.reason}`).join('\n')}\n\n## 系统提示词\n${plan.system_prompt}`,'迭代记录.md':p.history.versions.map(v=>`## V${v.version} · ${v.date}\n${v.change}`).join('\n\n'),'给AI编程工具的提示词.md':'请先阅读 PRD.md 和方案.md。此包是前端演示数据，请先与产品负责人确认真实需求，再基于 SpecFlow Engine 生成正式方案，不要把示例当成已验证的架构。'});const url=URL.createObjectURL(blob);urls.set(key,url);return url}
