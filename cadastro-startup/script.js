    <script>
        function setupCustomSelect(selectId) {
            const selectEl = document.getElementById(selectId);
            if (!selectEl) return;
            
            // Remove dropdown customizado existente para recriar
            if (selectEl.nextElementSibling && selectEl.nextElementSibling.classList.contains('custom-select-container')) {
                selectEl.nextElementSibling.remove();
            }

            // Esconde o select nativo
            selectEl.style.display = 'none';

            // Cria o container do select customizado
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select-container';
            if (selectEl.disabled) wrapper.classList.add('disabled');

            // Cria a parte visível (selecionada)
            const selectedDiv = document.createElement('div');
            selectedDiv.className = 'select-selected';
            
            const selectedText = document.createElement('span');
            selectedText.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || 'Selecione...';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-chevron-down';

            selectedDiv.appendChild(selectedText);
            selectedDiv.appendChild(icon);
            wrapper.appendChild(selectedDiv);

            // Cria a lista de opções (dropdown)
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'select-items select-hide';

            Array.from(selectEl.options).forEach((option, index) => {
                if (index === 0 && option.value === "") return; // Pula o placeholder
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'select-item';
                itemDiv.textContent = option.textContent;
                
                itemDiv.addEventListener('click', function(e) {
                    // Atualiza o select nativo
                    selectEl.selectedIndex = index;
                    selectedText.textContent = this.textContent;
                    
                    // Atualiza estilos de seleção
                    const sameAsSelected = itemsDiv.querySelectorAll('.same-as-selected');
                    sameAsSelected.forEach(el => el.classList.remove('same-as-selected'));
                    this.classList.add('same-as-selected');
                    
                    // Dispara evento change nativo
                    const event = new Event('change', { bubbles: true });
                    selectEl.dispatchEvent(event);
                    
                    // Fecha o dropdown
                    selectedDiv.click();
                });
                
                itemsDiv.appendChild(itemDiv);
            });

            wrapper.appendChild(itemsDiv);
            // Insere logo após o select nativo
            selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);

            // Abre/fecha o dropdown
            selectedDiv.addEventListener('click', function(e) {
                e.stopPropagation();
                closeAllSelect(this);
                itemsDiv.classList.toggle('select-hide');
                wrapper.classList.toggle('active');
            });
        }

        function closeAllSelect(exceptEl) {
            const items = document.querySelectorAll('.select-items');
            const selects = document.querySelectorAll('.custom-select-container');
            
            items.forEach(item => {
                if (exceptEl !== item.previousElementSibling) {
                    item.classList.add('select-hide');
                }
            });
            
            selects.forEach(select => {
                if (exceptEl !== select.firstElementChild) {
                    select.classList.remove('active');
                }
            });
        }

        // Fecha selects se clicar fora
        document.addEventListener('click', closeAllSelect);

        // Custom File Upload
        document.addEventListener('DOMContentLoaded', () => {
            const fileInput = document.getElementById('logo');
            const fileName = document.getElementById('file-name');
            
            if (fileInput && fileName) {
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files.length > 0) {
                        fileName.textContent = this.files[0].name;
                        fileName.style.color = 'var(--clr-orange)';
                    } else {
                        fileName.textContent = 'Clique para escolher a logo...';
                        fileName.style.color = '';
                    }
                });
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            const estadoSelect = document.getElementById('estado');
            const cidadeSelect = document.getElementById('cidade');
            
            // Inicializa custom selects com valores vazios
            setupCustomSelect('estado');
            setupCustomSelect('cidade');
            
            // 1. Carrega Estados
            fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
                .then(response => response.json())
                .then(estados => {
                    estados.sort((a, b) => a.nome.localeCompare(b.nome));
                    estados.forEach(estado => {
                        const option = document.createElement('option');
                        option.value = estado.sigla;
                        option.textContent = `${estado.nome} (${estado.sigla})`;
                        estadoSelect.appendChild(option);
                    });
                    // Recria o custom select após adicionar options
                    setupCustomSelect('estado');
                })
                .catch(error => console.error('Erro ao carregar estados:', error));

            // 2. Quando estado mudar, busca cidades
            estadoSelect.addEventListener('change', (e) => {
                const uf = e.target.value;
                
                // Reset visual e lógico
                cidadeSelect.innerHTML = '<option value="">Carregando...</option>';
                cidadeSelect.disabled = true;
                setupCustomSelect('cidade'); // Atualiza UI para 'Carregando...'
                
                if (!uf) {
                    cidadeSelect.innerHTML = '<option value="">Selecione um estado primeiro</option>';
                    setupCustomSelect('cidade');
                    return;
                }
                
                fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
                    .then(response => response.json())
                    .then(cidades => {
                        cidadeSelect.innerHTML = '<option value="">Selecione uma cidade</option>';
                        cidades.sort((a, b) => a.nome.localeCompare(b.nome));
                        
                        cidades.forEach(cidade => {
                            const option = document.createElement('option');
                            option.value = cidade.nome;
                            option.textContent = cidade.nome;
                            cidadeSelect.appendChild(option);
                        });
                        
                        cidadeSelect.disabled = false;
                        // Recria dropdown com os novos dados
                        setupCustomSelect('cidade');
                    })
                    .catch(error => {
                        console.error('Erro ao carregar cidades:', error);
                        cidadeSelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
                        setupCustomSelect('cidade');
                    });
            });

            // Máscara para o WhatsApp
            const whatsappInput = document.getElementById('whatsapp');
            if (whatsappInput) {
                whatsappInput.addEventListener('input', function (e) {
                    let value = e.target.value.replace(/\D/g, ''); // Remove tudo o que não for número
                    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos
                    
                    // Aplica a máscara: (99) 99999-9999
                    if (value.length > 2) {
                        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                    }
                    if (value.length > 10) {
                        value = `${value.slice(0, 10)}-${value.slice(10)}`;
                    }
                    e.target.value = value;
                });
            }
        });
    </script> 