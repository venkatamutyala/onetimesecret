import{d as f,c as l,b as o,k as x,u as n,h as g,o as i,I as k,r as u,a as h,t as w,p as D,j as V,q as A,s as N}from"./main-Btd-C4m9.js";import{B as $}from"./BasicFormAlerts-uf1uvR0x.js";import{u as B}from"./formSubmission-B6xd2Pzw.js";const S=o("label",{for:"domain",class:"hidden text-xl font-medium leading-6 text-gray-900 dark:text-gray-100 bg-inherit","aria-hidden":"false"}," Domain name ",-1),E={class:"relative mt-2 rounded-md shadow-sm"},F=["value","placeholder","aria-invalid"],C={class:"pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"},I={key:0,class:"mt-2 text-sm text-red-600 dark:text-red-400",id:"domain-error"},M=f({__name:"DomainInput",props:{domain:{},placeholder:{},isValid:{type:Boolean}},setup(y){return(a,c)=>(i(),l("div",null,[S,o("div",E,[o("input",{type:"text",name:"domain",id:"domain",value:a.domain,placeholder:a.placeholder,"aria-invalid":!a.isValid,"aria-describedby":"domain-error",class:"block w-full rounded-md border-0 py-3 pl-5 pr-10 text-xl text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brandcomp-600 shadow-sm dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-brandcomp-500"},null,8,F),o("div",C,[a.isValid?g("",!0):(i(),x(n(k),{key:0,icon:"heroicons:exclamation-circle",class:"h-6 w-6 text-red-500","aria-hidden":"true"}))])]),a.isValid?g("",!0):(i(),l("p",I," Not a valid domain address. "))]))}}),j={class:"space-y-9 my-16 dark:bg-gray-900"},q=["value"],R=["disabled"],T=f({__name:"DomainForm",emits:["domain-added"],setup(y,{emit:a}){const c=a,e=u(""),m=u(window.shrimp),s=r=>{m.value=r},{isSubmitting:d,error:v,success:b,submitForm:_}=B({url:"/api/v1/account/domains/add",successMessage:"Domain added successfully.",onSuccess:r=>{console.log("Domain added:",r),e.value=r.record.display_domain,e.value||console.error("Domain is undefined or empty");try{c("domain-added",e.value)}catch(t){console.error("Error emitting domain-added event:",t)}},onError:r=>{console.error("Error adding domain:",r)},handleShrimp:s});return(r,t)=>(i(),l("div",j,[h($,{success:n(b),error:n(v)},null,8,["success","error"]),o("form",{onSubmit:t[1]||(t[1]=D((...p)=>n(_)&&n(_)(...p),["prevent"])),class:"space-y-6"},[o("input",{type:"hidden",name:"shrimp",value:m.value},null,8,q),h(M,{modelValue:e.value,"onUpdate:modelValue":t[0]||(t[0]=p=>e.value=p),"is-valid":!0,domain:"",autofocus:"",required:"",placeholder:"e.g. secrets.example.com",class:"dark:bg-gray-800 dark:text-white dark:border-gray-700"},null,8,["modelValue"]),o("button",{type:"submit",disabled:n(d),class:"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-xl font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400 dark:focus:ring-offset-gray-900"},w(n(d)?"Adding...":"Continue"),9,R)],32)]))}}),U={class:"container mx-auto px-4 py-8"},z=o("h1",{class:"text-3xl font-bold mb-6 dark:text-white"},"Add your domain",-1),G={key:0,class:"mt-4 text-gray-600 dark:text-gray-400"},L=f({__name:"AccountDomainAdd",setup(y){const a=u(window.shrimp),c=N(),e=u(!1);V(()=>{console.log("AccountDomainAdd component mounted")});const m=async s=>{if(!s)throw new Error("Domain is undefined or empty");e.value=!0;try{console.info("Navigation to verify",s),window.vue_component_name="AccountDomainVerify",await c.replace({name:"AccountDomainVerify",params:{domain:s}}),await A()}catch(d){console.error("Navigation error:",d),e.value=!1}};return(s,d)=>(i(),l("main",U,[z,h(T,{shrimp:a.value,onDomainAdded:m,disabled:e.value},null,8,["shrimp","disabled"]),e.value?(i(),l("p",G,"Navigating to verification page...")):g("",!0)]))}});export{L as default};
