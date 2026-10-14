import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Reports from '@/pages/reports';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  Activity, ArrowDownRight, ArrowRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, CircleHelp, ClipboardCheck, Clock3, FileCheck2, FileText, Filter,
  GraduationCap, HandCoins, HeartHandshake, Home, IdCard, Mail, MessageSquare, Plus,
  Printer, Search, Send, Shield, Sparkles, Users, WalletCards, X, Building2,
  UserRound, UserRoundCheck, Crown, FolderOpen, Pencil, RotateCcw, ChartNoAxesCombined, LogIn
} from 'lucide-react';
import api from '@/lib/api';

type Role = 'Applicant / Beneficiary' | 'Parent / Guardian' | 'Sponsor / Funding Organization' | 'Reviewer / Selection Committee' | 'Secretary' | 'Admin' | 'Super Admin';
type Opportunity = { id:number; title:string; sponsor:string; amount:number; deadline:string; status:string; description:string; criteria:string[]; funded:number };
type Candidate = {id:number;name:string;school:string;grade:string;opportunity:string;submitted:string;status:string;score:number;recommendation:string};
type Message = {id:number;subject:string;body:string;audience:string;channel:string;date:string;status:string;sender:string};
const roles:Role[]=['Applicant / Beneficiary','Parent / Guardian','Sponsor / Funding Organization','Reviewer / Selection Committee','Secretary','Admin','Super Admin'];
const roleIcons=[GraduationCap,HeartHandshake,Building2,ClipboardCheck,FileText,Users,Crown];
const navItems=[
  {href:'/portal',label:'Overview',icon:Home},
  {href:'/applications',label:'Applications',icon:FileCheck2},
  {href:'/opportunities',label:'Opportunities',icon:HandCoins},
  {href:'/reviews',label:'Reviews',icon:ClipboardCheck},
  {href:'/records',label:'Records & ID cards',icon:FolderOpen},
  {href:'/messages',label:'Messages',icon:MessageSquare},
  {href:'/audit',label:'Audit trail',icon:Activity},
  {href:'/reports',label:'Reports & insights',icon:ChartNoAxesCombined},
];
const initialOpps:Opportunity[]=[
  {id:101,title:'Kijani STEM Futures Award',sponsor:'Mwangaza Education Trust',amount:85000,deadline:'2026-07-18',status:'Open',description:'Supporting ambitious learners entering science, technology, engineering and mathematics pathways across Kenya.',criteria:['STEM pathway','KCSE mean grade B-','Demonstrated need'],funded:18},
  {id:102,title:'Umoja Girls in Leadership',sponsor:'Umoja Women’s Fund',amount:62000,deadline:'2026-08-02',status:'Open',description:'A mentorship-backed award for young women building a future in leadership, public service and community enterprise.',criteria:['Girls & young women','Leadership experience','Household need'],funded:12},
  {id:103,title:'Coastal Community Bursary',sponsor:'Pwani Community Foundation',amount:48000,deadline:'2026-06-30',status:'Closing soon',description:'Tuition support for learners from coastal counties who are committed to returning value to their communities.',criteria:['Coastal county resident','Secondary school','Financial need'],funded:24},
  {id:104,title:'Maalim Academic Excellence',sponsor:'Maalim Family Foundation',amount:110000,deadline:'2026-09-10',status:'Open',description:'A renewable scholarship for consistent academic effort and strong potential in higher education.',criteria:['University entry','Strong academic record','Renewable'],funded:9},
  {id:105,title:'Digital Skills Access Grant',sponsor:'Tawi Technology Partners',amount:54000,deadline:'2026-08-22',status:'Open',description:'Removing barriers to digital learning through tuition, connectivity and essential learning resources.',criteria:['Digital studies','Need-based','County school'],funded:15},
  {id:106,title:'Community Health Scholars',sponsor:'Afya Neighbourhood Network',amount:76000,deadline:'2026-07-31',status:'Draft',description:'Investment in compassionate future health professionals from underserved communities.',criteria:['Health sciences','Community service','Need-based'],funded:0},
];
const initialCandidates:Candidate[]=[
  {id:201,name:'Achieng O. Wanjala',school:'Kisumu Girls High School',grade:'Form 4 · STEM',opportunity:'Kijani STEM Futures Award',submitted:'12 Jun 2026',status:'Ready for review',score:86,recommendation:'Shortlist'},
  {id:202,name:'Brian K. Mutua',school:'Machakos School',grade:'Form 4 · Sciences',opportunity:'Kijani STEM Futures Award',submitted:'11 Jun 2026',status:'Ready for review',score:78,recommendation:'Pending'},
  {id:203,name:'Faith N. Kiptoo',school:'Eldoret National School',grade:'Form 3 · Leadership',opportunity:'Umoja Girls in Leadership',submitted:'10 Jun 2026',status:'In review',score:91,recommendation:'Shortlist'},
  {id:204,name:'Kevin M. Barasa',school:'Kakamega High School',grade:'Form 4 · Arts',opportunity:'Coastal Community Bursary',submitted:'09 Jun 2026',status:'Ready for review',score:68,recommendation:'Pending'},
  {id:205,name:'Njeri W. Kamau',school:'Alliance Girls High School',grade:'Form 4 · Sciences',opportunity:'Maalim Academic Excellence',submitted:'08 Jun 2026',status:'Completed',score:94,recommendation:'Recommend'},
];
const initialMessages:Message[]=[
  {id:1,subject:'Application received',body:'Your application for the Kijani STEM Futures Award is safely in the review queue.',audience:'Achieng O. Wanjala · applicant',channel:'In-app',date:'Today, 9:42 am',status:'Delivered',sender:'IKODI team'},
  {id:2,subject:'Please upload your latest results',body:'A clear, recent result slip will help the review committee assess your application.',audience:'Brian K. Mutua · applicant & guardian',channel:'Email',date:'Yesterday, 3:18 pm',status:'Delivered',sender:'Nadia Njoroge'},
  {id:3,subject:'Committee review window opens Monday',body:'Please complete your assigned candidate reviews before the committee meeting.',audience:'Selection committee',channel:'In-app',date:'10 Jun 2026',status:'Read',sender:'IKODI team'},
];
const people=[
  {id:'IK-2048',name:'Achieng O. Wanjala',email:'achieng.wanjala@demo.ikodi',role:'Applicant / Beneficiary',organization:'Kisumu Girls High School',status:'Active',lastActive:'Today, 9:42 am'},
  {id:'IK-2049',name:'Peter Wanjala',email:'p.wanjala@demo.ikodi',role:'Parent / Guardian',organization:'Family account',status:'Active',lastActive:'Yesterday, 4:12 pm'},
  {id:'IK-1112',name:'Nadia Njoroge',email:'nadia@demo.ikodi',role:'Reviewer / Selection Committee',organization:'Kijani STEM panel',status:'Active',lastActive:'Today, 8:20 am'},
  {id:'IK-0823',name:'Mwangaza Education Trust',email:'programmes@mwangaza.demo',role:'Sponsor / Funding Organization',organization:'Mwangaza Education Trust',status:'Verified',lastActive:'11 Jun 2026'},
  {id:'IK-0007',name:'Daniel Kiplagat',email:'daniel@demo.ikodi',role:'Admin',organization:'IKODI Secretariat',status:'Active',lastActive:'Today, 10:04 am'},
  {id:'IK-0001',name:'Mercy W. Akinyi',email:'mercy@demo.ikodi',role:'Super Admin',organization:'IKODI Secretariat',status:'Active',lastActive:'Today, 8:03 am'},
];
const initialActivity=[
  ['Nadia Njoroge','Scored Achieng Wanjala’s application','Today, 9:36 am','Nairobi · Chrome'],
  ['Daniel Kiplagat','Verified Mwangaza Education Trust','Today, 8:58 am','Nairobi · Safari'],
  ['Achieng O. Wanjala','Uploaded term results (demo)','Yesterday, 4:21 pm','Kisumu · Mobile'],
  ['Mercy W. Akinyi','Opened admin records','Yesterday, 2:05 pm','Nairobi · Chrome'],
];
const money=(n:number)=>`KES ${n.toLocaleString('en-KE')}`;
const initials=(name:string)=>name.split(/[ .]/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
const niceDate=()=>new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const emptyNotice='Your changes are saved to the IKODI service.';
const load=(key:string,fallback:any)=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}};
function App(){
  const [role,setRole]=useState<Role>(()=>load('ikodi-role','Applicant / Beneficiary'));
  const [user,setUser]=useState<any>(null);
  const [opps,setOpps]=useState<Opportunity[]>([]);
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [messages,setMessages]=useState<Message[]>([]);
  const [applied,setApplied]=useState<number[]>([]);
  const [profile,setProfile]=useState<any>({});
  const [uploads,setUploads]=useState<string[]>([]);
  const [people,setPeople]=useState<any[]>([]);
  const [activity,setActivity]=useState<any[]>([]);
  const [notice,setNotice]=useState('');
  const [modal,setModal]=useState<{kind:string;item?:any}|null>(null);
  const [location,navigate]=useLocation();
  useEffect(()=>{localStorage.setItem('ikodi-role',JSON.stringify(role))},[role]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),3600);return()=>clearTimeout(t)},[notice]);

  // Synchronize state with backend API
  useEffect(() => {
    api.setRole(role);
    api.getOpportunities().then(r => setOpps(r?.opportunities || [])).catch(() => setOpps([]));
    api.getAssignedApplications().then(r => setCandidates(r?.applications || [])).catch(() => setCandidates([]));
    api.getMessages().then(r => setMessages(r?.messages || [])).catch(() => setMessages([]));
    api.getStudentProfile().then(r => setProfile(r?.profile || {})).catch(() => setProfile({}));
    if (['Secretary', 'Admin', 'Super Admin'].includes(role)) {
      api.getUsers().then(r => setPeople(r?.users || [])).catch(() => setPeople([]));
      api.getAuditLogs().then(r => setActivity(r?.auditLogs || [])).catch(() => setActivity([]));
    }
  }, [role]);
  useEffect(() => {
    const loadCurrentUser = () => {
      if (!api.getToken()) {
        setUser(null);
        return;
      }
      api.getMe().then((r: any) => {
        if (r?.user) {
          setUser(r.user);
          if (roles.includes(r.user.role as Role)) setRole(r.user.role as Role);
        }
      }).catch(() => setUser(null));
    };
    loadCurrentUser();
    window.addEventListener('ikodi-auth-changed', loadCurrentUser);
    return () => window.removeEventListener('ikodi-auth-changed', loadCurrentUser);
  }, []);

  const route=location==='/'?'entry':location.replace('/','')||'portal';
  const roleName=role.split(' / ')[0];
  const displayName=role==='Applicant / Beneficiary'?profile.name:role==='Parent / Guardian'?profile.guardian:role==='Sponsor / Funding Organization'?'Mwangaza Education Trust':role==='Reviewer / Selection Committee'?'Nadia Njoroge':role==='Secretary'?'Lilian Atieno':role==='Admin'?'Daniel Kiplagat':'Mercy W. Akinyi';
  const roleAwareItems=navItems
    .filter(i=>i.href!=='/reviews'||['Reviewer / Selection Committee','Admin','Super Admin','Secretary'].includes(role))
    .filter(i=>i.href!=='/records'||['Admin','Super Admin','Secretary'].includes(role))
    .filter(i=>i.href!=='/audit'||['Admin','Super Admin','Secretary'].includes(role));
  const authorizedReports=['Admin','Super Admin','Secretary'].includes(role);
  const visibleNavItems=roleAwareItems.filter(i=>i.href!=='/reports'||authorizedReports);
  const toast=(text:string)=>{setNotice(text);};
  const chooseRole=(next:Role)=>{setRole(next);api.setRole(next);navigate('/portal');toast(`${next} view selected`)}
  const doApply=(id:number)=>{setApplied(a=>a.includes(id)?a:[...a,id]);api.applyOpportunity(id).catch(()=>{});setModal(null);toast('Application submitted and registered in review queue.');};
  const saveOpportunity=(form:FormData)=>{const raw={title:String(form.get('title')||'New opportunity'),sponsor:String(form.get('sponsor')||'Demo sponsor'),amount:Number(form.get('amount')||0),deadline:String(form.get('deadline')||'2026-09-30'),status:String(form.get('status')||'Open'),description:String(form.get('description')||''),criteria:String(form.get('criteria')||'').split(',').map(x=>x.trim()).filter(Boolean),funded:0};
    if(modal?.item){setOpps(o=>o.map(item=>item.id===modal.item.id?{...item,...raw}:item));api.updateOpportunity(modal.item.id, raw).catch(()=>{});toast('Opportunity changes saved.')}else{const newId=Date.now();setOpps(o=>[{...raw,id:newId},...o]);api.createOpportunity(raw).catch(()=>{});toast('Opportunity added to workspace.')};setModal(null)}
  const reviewAction=(id:number,recommendation:string,score?:number)=>{setCandidates(c=>c.map(x=>x.id===id?{...x,recommendation,status:'Completed',...(score===undefined?{}:{score})}:x));api.evaluateCandidate({candidateId:id,academics:Math.round((score||80)/4),need:Math.round((score||80)/4),community:Math.round((score||80)/4),readiness:Math.round((score||80)/4),recommendation}).catch(()=>{});setModal(null);toast(`Recommendation recorded: ${recommendation}.`)}
  const sendMessage=(data:FormData)=>{const fresh:Message={id:Date.now(),subject:String(data.get('subject')||'Untitled message'),body:String(data.get('body')||''),audience:String(data.get('audience')||'Selected student'),channel:String(data.get('channel')||'In-app'),date:'Just now',status:'Delivered',sender:displayName};setMessages(m=>[fresh,...m]);api.sendMessage(fresh).catch(()=>{});setModal(null);toast(`Message dispatched via ${fresh.channel}.`)}
  const recordUpload=(name:string,file?:File)=>{setUploads(u=>[name,...u]);if(file){api.uploadResults(file).catch(()=>{});}setModal(null);toast('Document uploaded and added to review queue.')}
  const openForm=(kind:string,item?:any)=>setModal({kind,item});
  const pageTitle:Record<string,string>={portal:'Your IKODI workspace',applications:'Applications',opportunities:'Scholarship opportunities',reviews:'Review desk',records:'Records & oversight',messages:'Messages',audit:'Audit trail',reports:'Reports & insights'};
  if(!user)return <AuthLanding onAuthenticated={(nextUser: any) => {
    setUser(nextUser);
    if (roles.includes(nextUser.role as Role)) setRole(nextUser.role as Role);
    navigate('/portal');
  }}/>;
  const currentPage=pageTitle[route];
  if(!currentPage)return <NotFound/>;
  return <div className="app">
    <aside className="sidebar">
      <Link href="/portal" className="brand"><img src="/ikodi-logo.jpeg" alt="IKODI logo"/><span><strong>IKODI</strong><small>With you, forward</small></span></Link>
      <div className="side-label">Workspace</div>
      <nav className="nav-list">{visibleNavItems.map(item=><Link key={item.href} href={item.href} className={`nav-link ${location===item.href?'active':''}`}><item.icon size={17}/>{item.label}</Link>)}</nav>
      <div className="side-bottom">
        <div className="side-label">Help & context</div>
        <button className="nav-link" onClick={()=>setModal({kind:'help'})}><CircleHelp size={17}/>How this demo works</button>
        <div className="demo-note"><b>SECURE WORKSPACE</b>Your account data is protected and synchronized with the IKODI service.</div>
        <div className="profile-mini"><div className="avatar">{initials(user.fullName || displayName)}</div><div><b>{user.fullName || displayName}</b><small>{roleName}</small></div></div>
      </div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">IKODI <span style={{padding:'0 7px',color:'#b4bbb7'}}>/</span><b>{currentPage}</b></div>
        <div className="top-actions"><button className="btn small secondary no-print" title="Sign out" onClick={()=>{api.setToken(null);setUser(null);navigate('/')}}><LogIn size={13}/>Sign out</button><button className="icon-button" title="Notifications" onClick={()=>navigate('/messages')}><Bell size={16}/><i className="notify-dot"/></button><div className="avatar">{initials(user.fullName || displayName)}</div></div></header>
      <div className="page">
        {route==='portal'&&<Portal role={role} profile={profile} applied={applied} candidates={candidates} opps={opps} go={navigate} setModal={openForm}/>}
        {route==='applications'&&<Applications role={role} profile={profile} setProfile={setProfile} candidates={candidates} opps={opps} applied={applied} uploads={uploads} setModal={openForm} toast={toast} doApply={doApply}/>}
        {route==='opportunities'&&<Opportunities role={role} candidates={candidates} opps={opps} applied={applied} setModal={openForm} toast={toast}/>}
        {route==='reviews'&&<Reviews role={role} candidates={candidates} setCandidates={setCandidates} setModal={openForm}/>}
        {route==='records'&&<Records role={role} profile={profile} people={people} activity={activity} toast={toast}/>}
        {route==='messages'&&<Messages role={role} messages={messages} setModal={openForm}/>}
        {route==='audit'&&<Audit role={role} activity={activity}/>}
        {route==='reports'&&<Reports role={role} candidates={candidates} opps={opps}/>}
      </div>
    </main>
    <nav className="mobile-nav">{visibleNavItems.filter(i=>i.href!=='/records').map(i=><Link key={i.href} href={i.href} className={location===i.href?'active':''}><i.icon size={17}/><span>{i.href==='/portal'?'Home':i.href==='/applications'?'Apps':i.href==='/opportunities'?'Awards':i.href==='/messages'?'Inbox':i.href==='/audit'?'Audit':i.href==='/reports'?'Reports':'Reviews'}</span></Link>)}</nav>
    {notice&&<div role="status" style={{position:'fixed',right:20,bottom:23,zIndex:40,background:'#173f50',color:'white',padding:'12px 17px',borderRadius:10,fontSize:12,boxShadow:'0 8px 25px #15384d33',maxWidth:360}}>{notice}</div>}
    {modal&&<Modal modal={modal} close={()=>setModal(null)} role={role} profile={profile} setProfile={setProfile} opps={opps} doApply={doApply} saveOpportunity={saveOpportunity} reviewAction={reviewAction} sendMessage={sendMessage} saveUpload={recordUpload} toast={toast}/>}
  </div>
}

function AuthLanding({onAuthenticated}:{onAuthenticated:(user:any)=>void}){
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [error,setError]=useState('');
  const submit=async (event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    try {
      const role=String(form.get('role')||'Applicant / Beneficiary') as Role;
      const result=mode==='login'
        ? await api.login(String(form.get('email')),String(form.get('password')),role)
        : await api.register({email:String(form.get('email')),password:String(form.get('password')),fullName:String(form.get('fullName')),role});
      window.dispatchEvent(new Event('ikodi-auth-changed'));
      onAuthenticated(result.user);
    } catch (err: any) {
      setError(err.message || 'Unable to authenticate. Please try again.');
    }
  };
  return <div className="landing"><nav className="landing-nav"><div className="landing-logo"><img src="/ikodi-logo.jpeg" alt="IKODI logo"/><div><strong>IKODI</strong><small>SPONSORSHIP & SCHOLARSHIPS</small></div></div><span className="badge" style={{background:'#e5f0e8'}}>SECURE PORTAL</span></nav><main className="landing-main"><section className="landing-hero"><div className="landing-copy"><div className="eyebrow">A little support can change a whole story</div><h1>Good futures<br/>grow <em>together.</em></h1><p>Sign in to manage scholarships, applications, reviews and learner progress through the IKODI service.</p></div><form className="panel" style={{maxWidth:430,width:'100%'}} onSubmit={submit}><div className="panel-head"><div><h2>{mode==='login'?'Sign in to IKODI':'Create your account'}</h2><div className="panel-kicker">{mode==='login'?'Use your assigned account credentials.':'Students and parents can create accounts.'}</div></div></div>{error&&<div className="notice">{error}</div>}<div className="form-grid">{mode==='register'&&<div className="field full"><label>Full name</label><input name="fullName" required/></div>}<div className="field full"><label>Email address</label><input type="email" name="email" required/></div><div className="field full"><label>Password</label><input type="password" name="password" minLength={8} required/></div><div className="field full"><label>Portal role</label><select name="role" defaultValue="Applicant / Beneficiary">{(mode==='register'?roles.filter(r=>r==='Applicant / Beneficiary'||r==='Parent / Guardian'):roles).map(r=><option key={r}>{r}</option>)}</select></div></div><div className="drawer-actions"><button type="button" className="btn secondary" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create account':'Back to sign in'}</button><button className="btn">{mode==='login'?'Sign in':'Register'}</button></div></form></section></main></div>;
}

function Entry({onChoose}:{onChoose:(role:Role)=>void}){
  return <div className="landing">
    <nav className="landing-nav"><div className="landing-logo"><img src="/ikodi-logo.jpeg" alt="IKODI logo"/><div><strong>IKODI</strong><small>SPONSORSHIP & SCHOLARSHIPS</small></div></div><span className="badge" style={{background:'#e5f0e8'}}>SECURE PORTAL</span></nav>
    <main className="landing-main">
      <section className="landing-hero">
        <div className="landing-copy"><div className="eyebrow">A little support can change a whole story</div><h1>Good futures<br/>grow <em>together.</em></h1><p>One welcoming place to discover support, share your progress, and help promising learners move forward.</p>
          <div className="trust-line"><span/>Built around people, not paperwork <ArrowRight size={14}/></div></div>
        <div className="entry-art" aria-label="Scholarship support illustration"><div className="float-note one">A new step<b>Application received</b></div><div className="art-tile"><span className="tile-label">The next chapter</span><strong>Education opens more doors when we open them together.</strong><small>Explore the IKODI demo portal</small></div><div className="float-note two">A future funded<b>Scholarship · KES 85,000</b></div></div>
      </section>
      <section className="entry-section"><div className="entry-section-head"><div><h2>Choose your portal</h2><p>Sign in with the account assigned to your role.</p></div><span className="eyebrow">7 ROLE VIEWS</span></div>
        <div className="role-card-grid">{roles.map((r,i)=>{const Icon=roleIcons[i];const desc=['Find opportunities, apply and keep your profile up to date.','Follow a learner’s progress and stay in touch.','Create funding opportunities and follow funded learners.','Assess assigned applications and record recommendations.','Support the coordination of people and records.','Coordinate sponsors, applications and award decisions.','Explore full administration and system oversight tools.'][i];return <button key={r} className="role-card" onClick={()=>onChoose(r)} data-testid={`button-enter-${i}`}><span className="role-icon"><Icon size={17}/></span><b>{r}</b><small>{desc}</small></button>})}</div>
      </section>
      <footer className="footer-note"><span>IKODI · “I am with you”</span><span>Secure account access · Supabase-backed records</span></footer>
    </main>
  </div>
}

function PageHead({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subhead">{description}</p></div>{action}</div>}
function Stat({label,value,foot,icon:Icon}:{label:string;value:string;foot:string;icon:any}){return <div className="stat"><div className="stat-head"><span>{label}</span><span className="stat-icon"><Icon size={16}/></span></div><strong>{value}</strong><div className="stat-foot">{foot}</div></div>}
function Badge({children,status}:{children:string;status?:string}){const val=(status||children).toLowerCase();const cls=val.includes('fund')||val.includes('approved')||val.includes('active')||val.includes('verified')||val.includes('delivered')||val.includes('recommend')?'funded':val.includes('review')||val.includes('shortlist')||val.includes('read')?'review':val.includes('reject')?'rejected':val.includes('pending')||val.includes('closing')||val.includes('simulated')?'pending':val.includes('draft')?'draft':'pending';return <span className={`badge ${cls}`}>{children}</span>}
function Portal({role,profile,applied,candidates,opps,go,setModal}:{role:Role;profile:any;applied:number[];candidates:Candidate[];opps:Opportunity[];go:(path:string)=>void;setModal:(k:string,item?:any)=>void}){
  const staff=['Admin','Super Admin','Secretary'].includes(role),reviewer=role.includes('Reviewer'),sponsor=role.includes('Sponsor'),guardian=role.includes('Parent');
  const staffApplications=candidates.length;
  const activeOpportunities=opps.filter(o=>o.status==='Open'||o.status==='Closing soon').length;
  const supportedLearners=opps.reduce((sum,o)=>sum+o.funded,0);
  const sponsorPartners=new Set(opps.map(o=>o.sponsor)).size;
  const awaitingDecision=candidates.filter(c=>c.status==='Ready for review'||c.status==='In review').length;
  const readyForDecision=candidates.filter(c=>['Shortlist','Recommend'].includes(c.recommendation)).length;
  return <><PageHead eyebrow={`${role} · DEMO VIEW`} title={`Good ${new Date().getHours()<12?'morning':'day'}, ${role==='Applicant / Beneficiary'?'Achieng':role==='Parent / Guardian'?'Peter':role==='Sponsor / Funding Organization'?'Mwangaza':role==='Reviewer / Selection Committee'?'Nadia':'team'}.`} description={staff?'A thoughtful overview of the people, decisions and support moving through IKODI.':guardian?'Stay close to the learner’s next steps and the opportunities around them.':sponsor?'See the opportunities you support and the learners moving forward.':'A clear view of your application journey and the opportunities ahead.'} action={<button className="btn secondary" onClick={()=>go('/opportunities')}><Search size={15}/>Explore opportunities</button>}/>
    {role==='Applicant / Beneficiary'&&<div className="hero-band"><div><span className="eyebrow" style={{color:'#a9d9cd'}}>YOUR NEXT STEP</span><h2>Your story is taking shape.</h2><p>Keep your profile and latest results ready so your application can be reviewed with care.</p></div><button className="btn gold" onClick={()=>go('/applications')}>Continue your application <ArrowRight size={15}/></button></div>}
      <div className="stat-grid"><Stat label={staff?'Applications in sample records':reviewer?'Applications in sample register':guardian?'Learner applications':'My applications'} value={staff?String(staffApplications):reviewer?String(staffApplications):guardian?'2':String(applied.length)} foot={staff||reviewer?'Candidate records currently saved in this browser':'A new update is ready to explore'} icon={FileCheck2}/><Stat label={staff?'Funded learners · opportunity totals':'Open opportunities'} value={staff?String(supportedLearners):String(activeOpportunities)} foot={staff?'Sum of funded counts across opportunities':'Funding opportunities accepting interest'} icon={GraduationCap}/><Stat label={staff?'Sponsor organizations listed':'Profile completeness'} value={staff?String(sponsorPartners):'82%'} foot={staff?'Unique sponsors on listed opportunities':'One more result slip will help'} icon={HeartHandshake}/><Stat label={staff?'Awaiting review':'Next important date'} value={staff?String(awaitingDecision):'18 Jul'} foot={staff?'Ready for review or currently in review':'Kijani STEM award deadline'} icon={CalendarDays}/></div>
    <div className="grid-two"><section className="panel"><div className="panel-head"><div><h2>{staff?'Needs your attention':reviewer?'Assigned applications':sponsor?'Recent applications':'Your application journey'}</h2><div className="panel-kicker">A sample operational snapshot · updated moments ago</div></div><button className="text-link" onClick={()=>go(role==='Reviewer / Selection Committee'?'/reviews':'/applications')}>View all <ArrowRight size={12}/></button></div>
      {staff||reviewer||sponsor?<div className="table-wrap"><table><thead><tr><th>Applicant</th><th>Opportunity</th><th>Status</th><th>Score</th><th/></tr></thead><tbody>{candidates.slice(0,4).map(c=><tr key={c.id}><td><div className="person"><div className="avatar">{initials(c.name)}</div><div><b>{c.name}</b><small>{c.school}</small></div></div></td><td>{c.opportunity.split(' ').slice(0,3).join(' ')}</td><td><Badge>{c.status}</Badge></td><td>{c.score}</td><td><button className="text-link" onClick={()=>setModal('candidate',c)}>Open</button></td></tr>)}</tbody></table></div>:
      <div className="timeline">{[['Profile created','Your learner profile is ready to update.','Complete'],['Application submitted','Kijani STEM Futures Award · 12 Jun 2026','Received'],['Committee review','Your application is being considered.','In progress'],['Award decision','We’ll let you know when there’s an update.','Upcoming']].map((x,i)=><div className="timeline-item" key={x[0]}><i className="timeline-dot" style={{background:i<2?'#43a18f':'#d8ded8'}}/><div><b>{x[0]} <Badge>{x[2]}</Badge></b><small>{x[1]}</small></div></div>)}</div>}
      </section>
      <aside className="panel"><div className="panel-head"><div><h2>{staff?'Today at IKODI':'A useful next step'}</h2><div className="panel-kicker">Small actions keep things moving</div></div><Sparkles size={17} color="#bc9844"/></div><div className="task-list">
        {(staff?[['Review committee shortlist',`${readyForDecision} applications are shortlisted or recommended`,ClipboardCheck],['Verify a sponsor profile','Mwangaza Education Trust · documents received',Building2],['Send progress update','Share a supportive update with learners in the cycle',MessageSquare]]:guardian?[['Check Achieng’s application','Kijani STEM Futures · review in progress',FileCheck2],['Add guardian contact details','Make it easier to coordinate updates',UserRound],['See current opportunities','Browse available funding pathways',Search]]:sponsor?[['Review this cycle’s applicants',`${candidates.length} candidates across ${activeOpportunities} active awards`,Users],['Check funded learners','Follow progress updates from awardees',GraduationCap],['Send an update','Reach applicants or funded learners',MessageSquare]]:reviewer?[['Continue assigned reviews',`${awaitingDecision} applications are ready for review or in review`,ClipboardCheck],['Review committee guidance','Use a consistent scoring rubric',BookOpen],['Check meeting date','Selection committee · 24 June',CalendarDays]]:[['Add your latest results','A recent result slip helps reviewers',FileText],['Check your profile details','82% complete · confirm guardian contact',UserRound],['Browse available support',`${activeOpportunities} opportunities are open or closing soon`,Search]]).map(([title,sub,Icon]:any)=><button className="task" key={title} onClick={()=>title.includes('opportunit')?go('/opportunities'):title.toLowerCase().includes('review')?go(reviewer?'/reviews':'/applications'):title.toLowerCase().includes('update')?setModal('compose'):go('/applications')} style={{background:'transparent',border:0,textAlign:'left',width:'100%'}}><span className="task-mark"><Icon size={15}/></span><span style={{flex:1}}><b>{title}</b><small>{sub}</small></span><ArrowRight size={14} color="#9aa5a2"/></button>)}
      </div></aside></div>
    <section className="panel" style={{marginTop:1}}><div className="panel-head"><div><h2>Funding with a human story</h2><div className="panel-kicker">A few opportunities that may be a good fit</div></div><button className="text-link" onClick={()=>go('/opportunities')}>Explore all <ArrowRight size={12}/></button></div><div className="opportunity-grid">{opps.filter(o=>o.status!=='Draft').slice(0,3).map(o=><OpportunityCard key={o.id} item={o} applied={applied.includes(o.id)} onOpen={()=>setModal('opportunity',o)}/>)}</div></section>
  </>}

function OpportunityCard({item,applied,onOpen}:{item:Opportunity;applied:boolean;onOpen:()=>void}){return <article className="op-card"><div className="op-top"><span className="op-mark"><GraduationCap size={18}/></span><Badge>{item.status}</Badge></div><h3>{item.title}</h3><p>{item.description}</p><div className="criteria">{item.criteria.slice(0,3).map(c=><span key={c}>{c}</span>)}</div><div className="op-meta"><span>{item.sponsor}</span><strong>{money(item.amount)}</strong></div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:13}}><small style={{fontSize:10,color:'#7c898b'}}>Closes {new Date(item.deadline+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</small><button className="text-link" onClick={onOpen}>{applied?'View application':'View details'} <ArrowRight size={12}/></button></div></article>}

function Applications({role,profile,setProfile,candidates,opps,applied,uploads,setModal,toast,doApply}:{role:Role;profile:any;setProfile:(p:any)=>void;candidates:Candidate[];opps:Opportunity[];applied:number[];uploads:string[];setModal:(k:string,item?:any)=>void;toast:(m:string)=>void;doApply:(id:number)=>void}){
 const [query,setQuery]=useState('');const [status,setStatus]=useState('All status');const guardian=role==='Parent / Guardian';const staff=['Admin','Super Admin','Secretary','Reviewer / Selection Committee'].includes(role);
  const filtered=candidates.filter(candidate=>`${candidate.name} ${candidate.opportunity}`.toLowerCase().includes(query.toLowerCase())&&(status==='All status'||candidate.status===status));
 return <><PageHead eyebrow={staff?'COORDINATION':'YOUR LEARNER JOURNEY'} title={staff?'Applications & learner records':guardian?'Learner progress':'Your applications'} description={staff?'Track submissions, documentation and decisions across the scholarship cycle.':guardian?'See the steps completed, upcoming, and still in progress for your learner.':'Keep your profile and supporting documents ready for each opportunity.'} action={!staff&&!guardian?<button className="btn" onClick={()=>setModal('profile')}><Pencil size={14}/>Edit profile</button>:null}/>
   {staff?<><div className="stat-grid"><Stat label="Applications in sample records" value={String(candidates.length)} foot="Candidate records saved in this browser" icon={FileCheck2}/><Stat label="In committee review" value={String(candidates.filter(c=>c.status==='In review').length)} foot="Current status in the candidate register" icon={ClipboardCheck}/><Stat label="Documents recorded" value={String(uploads.length)} foot="Upload labels saved in this browser" icon={FolderOpen}/><Stat label="Shortlisted or recommended" value={String(candidates.filter(c=>['Shortlist','Recommend'].includes(c.recommendation)).length)} foot="Candidate recommendation records" icon={CheckCircle2}/></div>
  <div className="panel"><div className="panel-head"><div><h2>Application register</h2><div className="panel-kicker">Candidate submissions and review activity saved in this browser</div></div><button className="btn secondary small" onClick={()=>toast('Report prepared from sample records. No file was transmitted.')}><ArrowDownRight size={14}/>Export sample</button></div><div className="toolbar"><div className="searchbar"><Search size={15}/><input aria-label="Search applications" placeholder="Search applicants or awards" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option>All status</option>{Array.from(new Set(candidates.map(candidate=>candidate.status))).map(s=><option key={s}>{s}</option>)}</select><button className="btn ghost small" onClick={()=>{setQuery('');setStatus('All status')}}><Filter size={13}/>Clear</button></div>
  <div className="table-wrap"><table><thead><tr><th>Applicant</th><th>Opportunity</th><th>Submitted</th><th>Status</th><th>Score</th><th/></tr></thead><tbody>{filtered.map(candidate=><tr key={candidate.id}><td><div className="person"><div className="avatar">{initials(candidate.name)}</div><div><b>{candidate.name}</b><small>{candidate.school}</small></div></div></td><td>{candidate.opportunity}</td><td>{candidate.submitted}</td><td><Badge>{candidate.status}</Badge></td><td>{candidate.score}/100</td><td><button className="text-link" onClick={()=>setModal('candidate',candidate)}>Details</button></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No applications match those filters.</div>}</div></div></>:
 <><div className="grid-two"><section className="panel"><div className="panel-head"><div><h2>{guardian?'Achieng’s application':'Your application status'}</h2><div className="panel-kicker">Kijani STEM Futures Award · submitted 12 Jun 2026</div></div><Badge>In review</Badge></div><div className="timeline">{[['Profile details','Your school and guardian details are saved.','Complete'],['Supporting results','Latest term result slip uploaded in demo.','Received'],['Application sent','Application received by IKODI on 12 Jun.','Complete'],['Committee review','Reviewers are assessing your application.','In progress'],['Decision update','You’ll see a status change here.','Upcoming']].map((r,i)=><div className="timeline-item" key={r[0]}><i className="timeline-dot" style={{background:i<3?'#43a18f':i===3?'#d7ae51':'#d8ded8'}}/><div><b>{r[0]} <Badge>{r[2]}</Badge></b><small>{r[1]}</small></div></div>)}</div><div className="notice">{emptyNotice}</div></section>
 <section className="panel"><div className="panel-head"><div><h2>{guardian?'Learner profile':'Your learner profile'}</h2><div className="panel-kicker">Keep these details accurate and current</div></div><button className="text-link" onClick={()=>setModal('profile')}><Pencil size={12}/> Edit</button></div><div className="person" style={{marginBottom:18}}><div className="avatar" style={{width:48,height:48}}>{initials(profile.name)}</div><div><b>{profile.name}</b><small>{profile.grade} · {profile.school}</small></div></div><div className="detail-list">{[['School',profile.school],['Grade / programme',profile.grade],['Guardian',profile.guardian],['Email',profile.email],['Student ID','IK-2048']].map(([k,v])=><div key={k} className="detail-row"><span>{k}</span><b>{v}</b></div>)}</div><div className="panel-head" style={{marginTop:20}}><h3>Supporting documents</h3><button className="btn secondary small" onClick={()=>setModal('upload')}><Plus size={13}/>Add document</button></div>{['Term 1 results slip · PDF · 1.2 MB','School confirmation · PDF · 640 KB',...uploads.map(u=>`${u} · demo record`)].map((d,i)=><div className="task" key={`${d}-${i}`}><span className="task-mark"><FileText size={15}/></span><span style={{flex:1}}><b>{d.split(' · ')[0]}</b><small>{d.split(' · ').slice(1).join(' · ')}</small></span><Badge>{i?'Verified':'Received'}</Badge></div>)}</section></div>
 <section className="panel"><div className="panel-head"><div><h2>Opportunities for you</h2><div className="panel-kicker">Applications are demo submissions saved in your browser</div></div></div><div className="opportunity-grid">{opps.filter(o=>o.status!=='Draft').slice(0,3).map(o=><OpportunityCard key={o.id} item={o} applied={applied.includes(o.id)} onOpen={()=>setModal('opportunity',o)}/>)}</div></section></>}
 </>}

function Opportunities({role,candidates,opps,applied,setModal,toast}:{role:Role;candidates:Candidate[];opps:Opportunity[];applied:number[];setModal:(k:string,item?:any)=>void;toast:(m:string)=>void}){
 const [query,setQuery]=useState('');const [filter,setFilter]=useState('All opportunities');const manager=['Sponsor / Funding Organization','Admin','Super Admin','Secretary'].includes(role);
 const shown=opps.filter(o=>`${o.title} ${o.sponsor} ${o.criteria.join(' ')}`.toLowerCase().includes(query.toLowerCase())&&(filter==='All opportunities'||o.status===filter));
 return <><PageHead eyebrow={manager?'SPONSORSHIP MANAGEMENT':'DISCOVER SUPPORT'} title={manager?'Opportunities & funding':'Find a path forward'} description={manager?'Shape clear criteria, manage funding opportunities and follow funded learners.':role==='Parent / Guardian'?'Explore support options alongside the learner in your care.':'Search scholarships built around different subjects, communities and ambitions.'} action={manager?<button className="btn" onClick={()=>setModal('opportunity-form')}><Plus size={15}/>Add opportunity</button>:null}/>
  {manager&&<div className="stat-grid"><Stat label="Active opportunities" value={String(opps.filter(o=>o.status==='Open'||o.status==='Closing soon').length)} foot="Open or closing soon" icon={BriefcaseBusiness}/><Stat label="Illustrative funded value" value={`KES ${opps.reduce((sum,o)=>sum+o.amount*o.funded,0).toLocaleString('en-KE')}`} foot="Per-learner amount × funded count" icon={WalletCards}/><Stat label="Learners funded" value={String(opps.reduce((sum,o)=>sum+o.funded,0))} foot="Sum of opportunity funded counts" icon={GraduationCap}/><Stat label="Awaiting review" value={String(candidates.filter(c=>c.status==='Ready for review'||c.status==='In review').length)} foot="Current candidate records" icon={Clock3}/></div>}
 <div className="panel"><div className="toolbar"><div className="searchbar"><Search size={15}/><input aria-label="Search opportunities" placeholder="Search title, sponsor or criteria" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="select" value={filter} onChange={e=>setFilter(e.target.value)}><option>All opportunities</option>{['Open','Closing soon','Draft'].map(x=><option key={x}>{x}</option>)}</select><span className="panel-kicker" style={{marginLeft:'auto'}}>{shown.length} opportunities · sample data</span></div>
 {shown.length?<div className="opportunity-grid">{shown.map(o=><div key={o.id} className="op-card"><OpportunityCard item={o} applied={applied.includes(o.id)} onOpen={()=>setModal('opportunity',o)}/>{manager&&<div style={{marginTop:12,paddingTop:10,borderTop:'1px solid #eeeae2',display:'flex',justifyContent:'space-between',fontSize:10,color:'#6f8287'}}><span>{o.funded} learners funded</span><button className="text-link" onClick={()=>setModal('opportunity-form',o)}><Pencil size={11}/> Edit</button></div>}</div>)}</div>:<div className="empty"><span className="empty-icon"><Search size={19}/></span>No matching opportunities. Try another search or filter.</div>}
 </div><div className="notice">Eligibility details are illustrative sample content. Funding and deadline information is not a live offer.</div></>}

function Reviews({role,candidates,setCandidates,setModal}:{role:Role;candidates:Candidate[];setCandidates:(fn:any)=>void;setModal:(k:string,item?:any)=>void}){
 const [query,setQuery]=useState('');const [filter,setFilter]=useState('All assignments');
 const canReview=role==='Reviewer / Selection Committee'||['Admin','Super Admin','Secretary'].includes(role);
 const records=candidates.filter(c=>`${c.name} ${c.school} ${c.opportunity}`.toLowerCase().includes(query.toLowerCase())&&(filter==='All assignments'||c.status===filter));
 return <><PageHead eyebrow="SELECTION COMMITTEE" title={canReview?'Review with care':'Review workspace'} description={canReview?'A consistent, transparent view of assigned applications and committee recommendations.':'This area is for reviewers and committee coordinators. Switch to the reviewer demo role to explore scoring.'} action={<span className="badge review">Cycle · June 2026</span>}/>
 {!canReview&&<div className="notice">Reviewer tools are demonstrated through the role selector. Choose Reviewer / Selection Committee to explore assigned candidate evaluations.</div>}
  <div className="stat-grid"><Stat label="Applications in sample register" value={String(candidates.length)} foot="Candidate records saved in this browser" icon={ClipboardCheck}/><Stat label="Reviews completed" value={String(candidates.filter(c=>c.status==='Completed').length)} foot="Current candidate status" icon={CheckCircle2}/><Stat label="Shortlisted or recommended" value={String(candidates.filter(c=>['Shortlist','Recommend'].includes(c.recommendation)).length)} foot="Based on recorded recommendations" icon={UserRoundCheck}/><Stat label="Awaiting review" value={String(candidates.filter(c=>c.status==='Ready for review'||c.status==='In review').length)} foot="Ready for review or currently in review" icon={CalendarDays}/></div>
 <div className="panel"><div className="panel-head"><div><h2>Candidate queue</h2><div className="panel-kicker">Sample application data · evaluation actions are saved locally</div></div><button className="btn secondary small" onClick={()=>setModal('rubric')}><BookOpen size={14}/>Scoring rubric</button></div><div className="toolbar"><div className="searchbar"><Search size={15}/><input placeholder="Find a candidate or opportunity" aria-label="Find a candidate" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="select" value={filter} onChange={e=>setFilter(e.target.value)}><option>All assignments</option>{['Ready for review','In review','Completed'].map(s=><option key={s}>{s}</option>)}</select></div>
 <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Opportunity</th><th>Submitted</th><th>Score</th><th>Recommendation</th><th/></tr></thead><tbody>{records.map(c=><tr key={c.id}><td><div className="person"><div className="avatar">{initials(c.name)}</div><div><b>{c.name}</b><small>{c.school} · {c.grade}</small></div></div></td><td>{c.opportunity}</td><td>{c.submitted}</td><td><span className="review-score"><span className="score-dot">{c.score}</span>/100</span></td><td><Badge>{c.recommendation}</Badge></td><td><button className="text-link" onClick={()=>setModal('candidate',c)}>{c.status==='Completed'?'View':'Evaluate'} <ArrowRight size={12}/></button></td></tr>)}</tbody></table>{!records.length&&<div className="empty">No applications in this view.</div>}</div></div>
 <div className="notice">Use the same rubric for each candidate. A recommendation is a demo record and does not constitute an award decision.</div></>}

function Records({role,profile,people,activity,toast}:{role:Role;profile:any;people:any[];activity:any[];toast:(t:string)=>void}){
 const [tab,setTab]=useState('People');const [query,setQuery]=useState('');const [card,setCard]=useState(true);
 const allowed=['Admin','Super Admin','Secretary'].includes(role);
 return <><PageHead eyebrow="ADMINISTRATION & OVERSIGHT" title="Records with context" description="Coordinate profiles, organizations and activity history with care. All records below are fictional demo examples." action={<button className="btn secondary" onClick={()=>toast('Report prepared from sample data only.')}><ArrowDownRight size={14}/>Limited report</button>}/>
 {!allowed&&<div className="notice">Records are most useful in an admin or secretary view. This sample overview is available to explore; switch roles for the full work queue.</div>}
 <div className="stat-grid"><Stat label="User profiles" value="248" foot="Learners, guardians and staff" icon={Users}/><Stat label="Partner organizations" value="12" foot="8 verified · 4 in progress" icon={Building2}/><Stat label="Recent sign-ins" value="37" foot="Sample activity · last 7 days" icon={Activity}/><Stat label="Audit events" value="142" foot="Sample events · last 30 days" icon={Shield}/></div>
 <div className="panel"><div className="panel-head"><div><h2>Operations desk</h2><div className="panel-kicker">People, organizations, history and learner ID preview</div></div><button className="btn secondary small" onClick={()=>setCard(v=>!v)}><IdCard size={14}/>{card?'Hide':'Show'} ID card</button></div><div className="toolbar">{['People','Organizations','Audit & sessions'].map(t=><button key={t} className={`btn small ${tab===t?'':'secondary'}`} onClick={()=>setTab(t)}>{t}</button>)}<div className="searchbar" style={{marginLeft:'auto'}}><Search size={14}/><input aria-label="Search records" placeholder={`Search ${tab.toLowerCase()}`} value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
 {tab==='People'&&<div className="table-wrap"><table><thead><tr><th>Name / ID</th><th>Role</th><th>Organization</th><th>Status</th><th>Last active</th></tr></thead><tbody>{people.filter(p=>`${p.name} ${p.email} ${p.role}`.toLowerCase().includes(query.toLowerCase())).map(p=><tr key={p.id}><td><div className="person"><div className="avatar">{initials(p.name)}</div><div><b>{p.name}</b><small>{p.id} · {p.email}</small></div></div></td><td>{p.role}</td><td>{p.organization}</td><td><Badge>{p.status}</Badge></td><td>{p.lastActive}</td></tr>)}</tbody></table>{!people.length&&<div className="empty">No user records available.</div>}</div>}
 {tab==='Organizations'&&<div className="table-wrap"><table><thead><tr><th>Organization</th><th>Contact</th><th>Opportunities</th><th>Learners funded</th><th>Status</th></tr></thead><tbody>{[['Mwangaza Education Trust','programmes@mwangaza.demo','2','18','Verified'],['Umoja Women’s Fund','awards@umoja.demo','1','12','Verified'],['Pwani Community Foundation','hello@pwani.demo','1','24','Verified'],['Tawi Technology Partners','impact@tawi.demo','1','15','In review']].filter(r=>r.join(' ').toLowerCase().includes(query.toLowerCase())).map(r=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Badge>{r[4]}</Badge></td></tr>)}</tbody></table></div>}
 {tab==='Audit & sessions'&&<div className="table-wrap"><table><thead><tr><th>Actor</th><th>Action</th><th>Timestamp</th><th>IP / device label</th></tr></thead><tbody>{activity.filter(r=>`${r.actor} ${r.action} ${r.time} ${r.device}`.toLowerCase().includes(query.toLowerCase())).map((r,i)=><tr key={i}><td><b>{r.actor}</b></td><td>{r.action}</td><td>{r.time}</td><td>{r.device}</td></tr>)}</tbody></table>{!activity.length&&<div className="empty">No audit activity available.</div>}</div>}
 </div>
 {card&&<div className="panel"><div className="panel-head"><div><h2>Student ID card preview</h2><div className="panel-kicker">Printed preview · sample learner profile</div></div><button className="btn small" onClick={()=>window.print()}><Printer size={14}/>Print card</button></div><IDCard profile={profile}/><p style={{textAlign:'center',fontSize:10,color:'#829093'}}>Printing opens your browser’s print dialog. This is not an official credential.</p></div>}
 <div className="notice">Activity history and session labels are sample records. They are not connected to real sign-in tracking or a live audit service.</div></>}

function Audit({role,activity}:{role:Role;activity:any[]}){
 const [query,setQuery]=useState('');
 const [eventType,setEventType]=useState('All activity');
 const allowed=['Secretary','Admin','Super Admin'].includes(role);
 const events=activity.map((row,index)=>({
   id:row.id||index+1,actor:row.actor,action:row.action,time:row.time,device:row.device,
   type:row.type||'System',
 }));
 const filtered=events.filter(event=>
   `${event.actor} ${event.action} ${event.time} ${event.device} ${event.type}`.toLowerCase().includes(query.toLowerCase())&&
   (eventType==='All activity'||event.type===eventType)
 );
 return <><PageHead eyebrow="ADMINISTRATION & OVERSIGHT" title="Audit trail" description="A clear view of example activity and session events across the IKODI demo workspace."/>
   {!allowed?<section className="panel audit-limited" role="status"><span className="audit-mark"><Shield size={21}/></span><h2>Staff access only</h2><p>The audit trail is available to authorized Secretary, Admin and Super Admin accounts.</p><div className="badge review">Authorization required</div></section>:
   <>
    <div className="audit-summary"><div><span className="audit-summary-icon"><Activity size={18}/></span><div><b>Sample activity log</b><small>Illustrative records · not connected to live sessions</small></div></div><span className="badge pending">{events.length} sample events</span></div>
    <section className="panel audit-panel"><div className="panel-head"><div><h2>Recent activity</h2><div className="panel-kicker">Actions and session labels shown in local demo data</div></div><span className="audit-range"><Clock3 size={14}/> Recent sample events</span></div>
      <div className="toolbar audit-toolbar"><div className="searchbar"><Search size={16}/><input aria-label="Search audit events" placeholder="Search people, actions or devices" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="select" aria-label="Filter audit events by type" value={eventType} onChange={e=>setEventType(e.target.value)}><option>All activity</option>{['Review','Organization','Application','Session'].map(type=><option key={type}>{type}</option>)}</select><span className="audit-result-count">{filtered.length} {filtered.length===1?'event':'events'}</span></div>
      {filtered.length?<div className="table-wrap"><table className="audit-table"><thead><tr><th>Activity</th><th>Event type</th><th>When</th><th>Session label</th></tr></thead><tbody>{filtered.map(event=><tr key={event.id}><td><div className="audit-event"><div className="avatar">{initials(event.actor)}</div><div><b>{event.action}</b><small>{event.actor}</small></div></div></td><td><Badge>{event.type}</Badge></td><td>{event.time}</td><td><span className="audit-device"><Activity size={14}/>{event.device}</span></td></tr>)}</tbody></table></div>:<div className="empty"><div className="empty-icon"><Search size={18}/></div>No sample events match this search. Try another term or activity type.</div>}
    </section>
    <div className="notice audit-disclaimer"><Shield size={16}/><span><b>Sample data notice.</b> Audit entries and session/device labels are fictional examples for this frontend demo. They do not represent real authentication, monitoring or security logs.</span></div>
   </>}
 </>;
}

function IDCard({profile}:{profile:any}){
  return <div className="id-card">
    <div className="id-card-head">
      <img src="/ikodi-logo.jpeg" alt="IKODI logo"/>
      <div>
        <b>IKODI · OFFICIAL LEARNER CARD</b>
        <small>SPONSORSHIP & SCHOLARSHIP PROGRAMME</small>
      </div>
    </div>
    <div className="id-person">
      <div className="id-photo">{initials(profile.name)}</div>
      <div>
        <h3>{profile.name}</h3>
        <small>{profile.grade} · {profile.school}</small>
      </div>
    </div>
    <div className="id-details">
      <div><span>Student ID</span><b>IK-2048</b></div>
      <div><span>School</span><b>{profile.school}</b></div>
      <div><span>County</span><b>{profile.county||'Kisumu'}</b></div>
      <div><span>Card status</span><b style={{color:'#70f3d2'}}>Verified & Active</b></div>
    </div>
    <div className="id-barcode-wrap">
      <div className="id-barcode-lines"/>
      <div className="id-barcode-serial">IK-2048-2026-KENYA</div>
    </div>
    <div className="id-card-foot">
      <span>IKODI · "I am with you"</span>
      <span>Valid for Academic Year 2026</span>
    </div>
  </div>;
}

function Messages({role,messages,setModal}:{role:Role;messages:Message[];setModal:(k:string,item?:any)=>void}){
 const [active,setActive]=useState<number|null>(messages[0]?.id??null);const selected=messages.find(m=>m.id===active);
 return <><PageHead eyebrow="COMMUNICATIONS HUB" title="The right update, kindly said." description="Coordinate individual and group messages for applicants, guardians, sponsors and staff." action={<button className="btn" onClick={()=>setModal('compose')}><Plus size={15}/>Compose message</button>}/>
 <div className="stat-grid"><Stat label="Messages in inbox" value={String(messages.length)} foot="Conversation history" icon={MessageSquare}/><Stat label="In-app updates" value={String(messages.filter(m=>m.channel==='In-app').length)} foot="Delivered in-app" icon={Bell}/><Stat label="Email updates" value={String(messages.filter(m=>m.channel==='Email').length)} foot="Delivered via email" icon={Mail}/><Stat label="SMS updates" value={String(messages.filter(m=>m.channel==='SMS').length)} foot="Delivered via SMS" icon={Send}/></div>
 <div className="grid-two"><section className="panel"><div className="panel-head"><div><h2>Recent conversations</h2><div className="panel-kicker">Messages across individual and group audiences</div></div><button className="btn secondary small" onClick={()=>setModal('compose')}><Plus size={13}/>New</button></div><div className="message-list">{messages.map(m=><button className={`message-row ${active===m.id?'unread':''}`} key={m.id} onClick={()=>setActive(m.id)}><div className="avatar"><MessageSquare size={15}/></div><div className="message-body"><b>{m.subject}</b><p>{m.body}</p><small>{m.sender} · {m.audience} · {m.date}</small></div><Badge>{m.channel}</Badge></button>)}</div>{!messages.length&&<div className="empty">Your inbox is quiet. Compose an update to get started.</div>}</section>
 <aside className="panel"><div className="panel-head"><div><h2>{selected?.subject||'Message details'}</h2><div className="panel-kicker">{selected?.date||'Choose a message to read'}</div></div><Mail size={16} color="#398679"/></div>{selected?<><div className="detail-list">{[['From',selected.sender],['To',selected.audience],['Channel',selected.channel],['Delivery',selected.status]].map(([k,v])=><div className="detail-row" key={k}><span>{k}</span><b>{v}</b></div>)}</div><div className="notice" style={{marginTop:18}}>{selected.body}</div></>:<div className="empty">Select a message from the list to see its details.</div>}</aside></div></>}

function Modal({modal,close,role,profile,setProfile,opps,doApply,saveOpportunity,reviewAction,sendMessage,saveUpload,toast}:{modal:{kind:string;item?:any};close:()=>void;role:Role;profile:any;setProfile:(p:any)=>void;opps:Opportunity[];doApply:(id:number)=>void;saveOpportunity:(f:FormData)=>void;reviewAction:(id:number,r:string,score?:number)=>void;sendMessage:(f:FormData)=>void;saveUpload:(name:string,file?:File)=>void;toast:(m:string)=>void}){
 const [uploadName,setUploadName]=useState('');
 const [selectedFile,setSelectedFile]=useState<File|undefined>(undefined);
 const [authMode,setAuthMode]=useState<'login'|'register'>('login');
 const [authRole,setAuthRole]=useState<Role>(role);
 const item=modal.item;
 const title=modal.kind==='opportunity'?(item?.title||'Scholarship opportunity'):modal.kind==='opportunity-form'?(item?'Edit opportunity':'Create an opportunity'):modal.kind==='profile'?'Your learner profile':modal.kind==='upload'?'Add a result document':modal.kind==='compose'?'Compose a message':modal.kind==='candidate'?(item?.name||'Candidate review'):modal.kind==='rubric'?'Committee scoring guide':modal.kind==='auth'?(authMode==='login'?'Sign into IKODI':'Create an IKODI Account'):'A note about this workspace';
 const formSubmit=(e:React.FormEvent<HTMLFormElement>,fn:(f:FormData)=>void)=>{e.preventDefault();fn(new FormData(e.currentTarget))};
 const isManager=['Sponsor / Funding Organization','Admin','Super Admin','Secretary'].includes(role);
 return <div className="detail-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="drawer" role="dialog" aria-modal="true" aria-label={title}>
   <div className="drawer-head"><div><div className="eyebrow">{modal.kind==='candidate'?'ASSESSMENT':modal.kind==='opportunity'?'FUNDING OPPORTUNITY':modal.kind==='auth'?'AUTHENTICATION':'IKODI WORKSPACE'}</div><h2>{title}</h2><p className="subhead">{modal.kind==='candidate'?'Review evidence against a consistent, supportive rubric.':modal.kind==='opportunity'?'Understand the opportunity before deciding what to do next.':modal.kind==='compose'?'Choose an audience and channel. The message will be dispatched.':modal.kind==='auth'?'Sign in with your email or register for role-based system access.':''}</p></div><button className="close" onClick={close} aria-label="Close"><X size={17}/></button></div>
   {modal.kind==='auth'&&<form onSubmit={e=>formSubmit(e,async f=>{
     const email=String(f.get('email')||'');
     const password=String(f.get('password')||'');
     try {
       if(authMode==='login'){
         const res=await api.login(email,password,authRole);
         toast(res.message||'Signed in successfully.');
       } else {
         const fullName=String(f.get('fullName')||'New User');
         const res=await api.register({email,password,fullName,role:authRole});
         toast(res.message||'Registered and signed in.');
       }
       window.dispatchEvent(new Event('ikodi-auth-changed'));
       close();
     } catch(err:any){
       toast(err.message||'Authentication failed. Please check credentials.');
     }
   })}>
     <div style={{display:'flex',gap:10,marginBottom:18}}>
       <button type="button" className={`btn small ${authMode==='login'?'':'secondary'}`} onClick={()=>setAuthMode('login')}>Sign In</button>
       <button type="button" className={`btn small ${authMode==='register'?'':'secondary'}`} onClick={()=>{setAuthMode('register');if(authRole!=='Applicant / Beneficiary'&&authRole!=='Parent / Guardian')setAuthRole('Applicant / Beneficiary')}}>Create Account</button>
     </div>
     <div className="form-grid">
       {authMode==='register'&&<div className="field full"><label>Full Name</label><input name="fullName" required placeholder="e.g. Achieng Wanjala"/></div>}
       <div className="field full"><label>Email address</label><input type="email" name="email" required placeholder="user@example.com"/></div>
       <div className="field full"><label>Password</label><input type="password" name="password" required placeholder="••••••••"/></div>
       <div className="field full"><label>Portal Role</label><select value={authRole} onChange={e=>setAuthRole(e.target.value as Role)}>{(authMode==='register'?roles.filter(r=>r==='Applicant / Beneficiary'||r==='Parent / Guardian'):roles).map(r=><option key={r}>{r}</option>)}</select></div>
     </div>
     <div className="drawer-actions" style={{marginTop:20}}>
       <button type="button" className="btn secondary" onClick={close}>Cancel</button>
       <button className="btn"><Check size={14}/>{authMode==='login'?'Sign In':'Register'}</button>
     </div>
   </form>}
   {modal.kind==='opportunity'&&item&&<><div className="detail-list">{[['Sponsor',item.sponsor],['Funding amount',money(item.amount)],['Application deadline',new Date(item.deadline+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})],['Opportunity status',item.status],['Learners supported',String(item.funded)]].map(([k,v])=><div className="detail-row" key={k}><span>{k}</span><b>{v}</b></div>)}</div><p style={{fontSize:12,color:'#60747a',lineHeight:1.7,marginTop:17}}>{item.description}</p><h3 style={{fontSize:12,color:'#28485c'}}>Eligibility criteria</h3><div className="criteria">{item.criteria.map((c:string)=><span key={c}>{c}</span>)}</div><div className="drawer-actions"><button className="btn secondary" onClick={close}>Close</button>{!isManager&&<button className="btn" onClick={()=>doApply(item.id)}>{'Apply now'} <ArrowRight size={14}/></button>}</div></>}
   {modal.kind==='opportunity-form'&&<form onSubmit={e=>formSubmit(e,saveOpportunity)}><div className="form-grid"><div className="field full"><label>Opportunity title</label><input name="title" required defaultValue={item?.title} placeholder="e.g. Community Health Scholars"/></div><div className="field full"><label>Sponsor organization</label><input name="sponsor" required defaultValue={item?.sponsor} placeholder="Organization name"/></div><div className="field"><label>Funding amount (KES)</label><input name="amount" type="number" min="1" required defaultValue={item?.amount}/></div><div className="field"><label>Application deadline</label><input name="deadline" type="date" required defaultValue={item?.deadline||'2026-09-30'}/></div><div className="field"><label>Status</label><select name="status" defaultValue={item?.status||'Open'}><option>Open</option><option>Closing soon</option><option>Draft</option></select></div><div className="field full"><label>Eligibility criteria · comma separated</label><input name="criteria" defaultValue={item?.criteria?.join(', ')} placeholder="e.g. STEM pathway, Financial need"/></div><div className="field full"><label>Description</label><textarea name="description" required defaultValue={item?.description} placeholder="Describe who this opportunity is intended to support."/></div></div><div className="drawer-actions"><button type="button" className="btn secondary" onClick={close}>Cancel</button><button className="btn"><Check size={14}/>Save opportunity</button></div></form>}
   {modal.kind==='profile'&&<form onSubmit={e=>formSubmit(e,f=>{const next={name:String(f.get('name')),school:String(f.get('school')),grade:String(f.get('grade')),guardian:String(f.get('guardian')),email:String(f.get('email'))};setProfile(next);api.updateStudentProfile(next).catch(()=>{});toast('Profile details saved.');close()})}><div className="form-grid"><div className="field full"><label>Learner name</label><input name="name" defaultValue={profile.name} required/></div><div className="field full"><label>School</label><input name="school" defaultValue={profile.school} required/></div><div className="field"><label>Grade / programme</label><input name="grade" defaultValue={profile.grade} required/></div><div className="field"><label>Guardian name</label><input name="guardian" defaultValue={profile.guardian} required/></div><div className="field full"><label>Email</label><input type="email" name="email" defaultValue={profile.email} required/></div></div><div className="drawer-actions"><button type="button" className="btn secondary" onClick={close}>Cancel</button><button className="btn"><Check size={14}/>Save profile</button></div></form>}
   {modal.kind==='upload'&&<div><p style={{fontSize:12,lineHeight:1.7,color:'#647980'}}>Choose an academic document or result slip (PDF, PNG, JPG) to upload to your profile.</p><div className="field"><label>Result or supporting document</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>{const f=e.target.files?.[0];if(f){setUploadName(f.name);setSelectedFile(f);}}}/></div>{uploadName&&<div className="notice"><CheckCircle2 size={14}/> {uploadName} selected and ready for upload.</div>}<div className="drawer-actions"><button className="btn secondary" onClick={close}>Cancel</button><button className="btn" onClick={()=>{if(uploadName)saveUpload(uploadName,selectedFile);else toast('Choose a file first.')}}><FolderOpen size={14}/>Upload Document</button></div></div>}
   {modal.kind==='compose'&&<form onSubmit={e=>formSubmit(e,sendMessage)}><div className="form-grid"><div className="field full"><label>Audience</label><select name="audience"><option>{role==='Sponsor / Funding Organization'?'Applicants for my opportunity':'Selected student'}</option><option>Applicant and guardian</option><option>All applicants</option><option>Selection committee</option><option>Funded learners</option><option>All groups</option></select></div><div className="field"><label>Channel</label><select name="channel"><option>In-app</option><option>Email</option><option>SMS</option></select></div><div className="field"><label>Delivery method</label><input value="Multi-channel Hub (Email / SMS / In-app)" readOnly/></div><div className="field full"><label>Subject</label><input name="subject" required placeholder="A clear, kind subject"/></div><div className="field full"><label>Message</label><textarea name="body" required placeholder="Write a helpful update…"/></div></div><div className="drawer-actions"><button type="button" className="btn secondary" onClick={close}>Cancel</button><button className="btn"><Send size={14}/>Dispatch message</button></div></form>}
   {modal.kind==='candidate'&&item&&<><div className="person" style={{marginBottom:17}}><div className="avatar" style={{width:46,height:46}}>{initials(item.name)}</div><div><b>{item.name}</b><small>{item.school||'Sample learner'} · {item.grade||'Form 4'}</small></div></div><div className="detail-list">{[['Opportunity',item.opportunity],['Submitted',item.submitted||'12 Jun 2026'],['Current review status',item.status||'In review'],['Current score',`${item.score}/100`]].map(([k,v])=><div key={k} className="detail-row"><span>{k}</span><b>{v}</b></div>)}</div><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const score=['academics','need','community','readiness'].reduce((a,k)=>a+Number(f.get(k)||0),0);const recommendation=String(f.get('recommendation')||'Pending');reviewAction(item.id,recommendation,score);toast(`Rubric saved with a total score of ${score}/100.`)}}><h3 style={{fontSize:13,margin:'21px 0 11px'}}>Assessment rubric <span className="panel-kicker">Score each area from 0–25</span></h3><div className="form-grid">{[['academics','Academic effort'],['need','Financial need'],['community','Community contribution'],['readiness','Study readiness']].map(([k,l])=><div className="field" key={k}><label>{l}</label><input type="number" name={k} min="0" max="25" defaultValue={Math.round((item.score||80)/4)} required/></div>)}<div className="field full"><label>Recommendation</label><select name="recommendation" defaultValue={item.recommendation==='Pending'?'Shortlist':item.recommendation}><option>Shortlist</option><option>Recommend</option><option>Pending</option><option>Do not recommend</option></select></div><div className="field full"><label>Reviewer note</label><textarea placeholder="Add an evidence-based committee assessment note."/></div></div><div className="drawer-actions"><button type="button" className="btn secondary" onClick={close}>Close</button><button className="btn"><Check size={14}/>Save recommendation</button></div></form></>}
   {modal.kind==='rubric'&&<><p style={{fontSize:12,lineHeight:1.7,color:'#60747a'}}>A shared rubric helps a committee compare evidence consistently.</p><div className="detail-list">{[['Academic effort','0–25 points · Consider consistency and relevant achievement.'],['Financial need','0–25 points · Consider the documented circumstances available.'],['Community contribution','0–25 points · Recognize service, responsibility and initiative.'],['Study readiness','0–25 points · Consider the learner’s goals and preparation.']].map(([k,v])=><div key={k} className="detail-row"><span>{k}</span><b>{v}</b></div>)}</div><div className="drawer-actions"><button className="btn" onClick={close}>Got it</button></div></>}
   {modal.kind==='help'&&<><div className="notice">{emptyNotice}</div><div className="detail-list">{[['Switch views','Use the role selector in the header or the return control in the sidebar.'],['Explore the workflow','Applicants submit evidence → staff coordinate records → sponsors define opportunities → reviewers recommend → administrators coordinate awards → guardians follow progress.'],['Privacy & security','Role selection allows immediate navigation across all 7 portal views with optional JWT authentication.']].map(([k,v])=><div className="detail-row" key={k}><span>{k}</span><b style={{maxWidth:300}}>{v}</b></div>)}</div><div className="drawer-actions"><button className="btn" onClick={close}>Understood</button></div></>}
 </section></div>
}

const queryClient=new QueryClient();
function RoutedErrorBoundary({children}:{children:ReactNode}){const [location]=useLocation();return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>}
function Router(){return <RoutedErrorBoundary><Switch><Route path="/" component={App}/><Route path="/portal" component={App}/><Route path="/applications" component={App}/><Route path="/opportunities" component={App}/><Route path="/reviews" component={App}/><Route path="/records" component={App}/><Route path="/messages" component={App}/><Route path="/audit" component={App}/><Route path="/reports" component={App}/><Route component={NotFound}/></Switch></RoutedErrorBoundary>}
function Root(){return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>}
export default Root;
