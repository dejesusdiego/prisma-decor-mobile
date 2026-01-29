// Script para preencher formul rio de login  
document.querySelector('input[type="email"]').focus();  
document.querySelector('input[type="email"]').value = 'teste.superadmin@studioos.local';  
document.querySelector('input[type="email"]').dispatchEvent(new Event('input', { bubbles: true }));  
document.querySelector('input[type="password"]').value = 'Teste@123456';  
document.querySelector('input[type="password"]').dispatchEvent(new Event('input', { bubbles: true })); 
