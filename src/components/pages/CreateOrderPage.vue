<template>
    <div class="container-fluid pt-3">
        <div class="pt-3">
            <h4>Создать заказ</h4>
        </div>
        <hr>
        <div class="col-6">
            <form @submit.prevent="SendOrderHandler">
                <div class="mb-3">
                    <div class="mb-3">
                        <label for="exampleFormControlInput1" class="form-label">Email address</label>
                        <div class="input-group">
                            <input v-model="formEmail.emailMenager" type="email" class="form-control" placeholder="Выберите почту" disabled readonly>
                            <button class="btn btn-outline-secondary" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">Выбрать почту</button>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="exampleFormControlTextarea1" class="form-label">Текст сообщения</label>
                    <textarea v-model="formData.message" class="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary" :disabled="isSubmit">
                        {{isSubmit ? 'Отправка...' : 'Отправить'}}
                    </button>
                </div>
            </form>
        </div>

        <div>
            <h5>Материалы для заказа</h5>

                <div class="list-group">

                    <div class="list-group-item d-flex">
                        <div class="col-1 fw-semibold text-center">#</div>
                        <div class="col-7 fw-semibold">Название</div>
                        <div class="col-1 fw-semibold">Ед изме.</div>
                        <div class="col-2 fw-semibold">Кол-во/по смете</div>
                        <div class="col-1 fw-semibold text-center">Действие</div>
                    </div>

                    <div v-for="(material, index) in selectedMaterials" :key="material.ID" class="list-group-item d-flex">
                        <div class="col-1 text-center">{{ index + 1 }}</div>
                        <div class="col-7">{{ material.Name }}</div>
                        <div class="col-1">{{ material.TypeUnit }}</div>
                        <div class="col-2">
                            <div class="input-group">
                                <input v-if="getSendItem(material.ID)" v-model.number="getSendItem(material.ID).quantity" type="number" step="0.01" class="form-control">
                                <span class="input-group-text" id="basic-addon1">{{ material.Quantity }}</span>
                            </div>
                        </div>
                        <div class="col-1 text-center">
                            <button type="button" class="btn btn-outline-danger" @click="DeleteMaterialOrder(material.ID)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>

                </div>


        </div>
        <hr>
        <div>
            <h5>Материалы</h5>
            <div class="list-group">
                <div class="list-group-item d-flex">
                    <div class="col-2">
                        <select v-model="filterEstimate" class="form-select form-select-sm" aria-label="Default select example">
                            <option selected value="" >Выбрать смету</option>
                            <option v-for="estimate in estimates" :key="estimate.ID" :value="estimate.name">{{ estimate.name }}</option>
                        </select>
                    </div>
                    <div class="col-3">
                        <input v-model="searchQuery" type="text" class="form-control form-control-sm" placeholder="Поиск по названию...">
                    </div>
                </div>

                <div class="list-group-item d-flex">
                    <div class="col-1 fw-semibold d-flex">
                        <div class="col-6 fw-semibold">#</div>
                        <div class="col-6 fw-semibold"></div>
                    </div>
                    <div class="col-2 fw-semibold">Смета</div>
                    <div class="col-5 fw-semibold">Наименование</div>
                    <div class="col-1 fw-semibold text-center">Ед. изм</div>
                    <div class="col-1 fw-semibold">Кол-во</div>
                    <div class="col-1 fw-semibold">Цена</div>
                    <div class="col-1 fw-semibold">Цена сум</div>
                </div>

                <div v-for="item in filter" :key="item.ID" class="list-group-item d-flex">
                    <div class="col-1 d-flex">
                        <div class="col-6">{{item.IdSmeta}}</div>
                        <div class="col-6">
                            <input v-model="selectMaterialsId" :value="item.ID" :id="item.ID" class="form-check-input" type="checkbox">
                        </div>
                    </div>
                    <div class="col-2">{{item.Estimate.name}}</div>
                    <div class="col-5">{{item.Name}}</div>
                    <div class="col-1 text-center">{{item.TypeUnit}}</div>
                    <div class="col-1">{{item.Quantity}}</div>
                    <div class="col-1">{{item.PriceSmeta}}</div>
                    <div class="col-1">{{(item.PriceSmeta*item.Quantity).toFixed(2)}}</div>
                </div>

            </div>
        </div>
        
        <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel">
            <div class="offcanvas-header border-bottom">
                <h5 class="offcanvas-title" id="offcanvasRightLabel">Выбрать почту</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body p-0">
                <div class="d-flex flex-column align-items-stretch flex-shrink-0 bg-body-tertiary">
                    <div class="list-group list-group-flush border-bottom scrollarea" id="sluppiersList">

                        <div v-for="supplier in suppliers" :key="supplier.ID" class="list-group-item list-group-item-action py-3 lh-sm"> 
                            <div class="d-flex w-100 align-items-center"> 
                                <strong class="mb-1">{{ supplier.Name }}</strong> 
                            </div> 
                            <div class="col-10 mb-1">
                                #{{ supplier.Specialization }}
                            </div>
                            <a v-if="supplier.manager_cards" href="" role="button" data-bs-toggle="collapse" :data-bs-target="`#supplier-${supplier.ID}`" aria-expanded="false">
                                показать Email
                            </a>
                            <div class="collapse mt-3" :id="`supplier-${supplier.ID}`" data-bs-parent="#sluppiersList">
                                <div v-for="manager in supplier.manager_cards" :key="manager.id" class="mb-3">
                                    {{ manager.full_name }}
                                    <br>
                                    <a href="" @click.prevent="formEmail.emailMenager = manager.email; formEmail.menagerID=manager.ID">{{ manager.email }}</a>
                                </div>
                            </div> 
                        </div>
                    </div>         
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted, reactive, ref, watch } from 'vue';
    import api from '../../api';
    import { useRoute } from 'vue-router';

    const route = useRoute();

    const estimates = ref([]);
    const materials = ref([]);
    const suppliers = ref([]);

    const selectMaterialsId = ref([]);
    const materialsSend = ref([]);

    const filterEstimate = ref("");
    const searchQuery = ref("");

    const formEmail = ref({
        menagerID:0,
        emailMenager:"",
    })

    const formData = reactive({
        manager_card_id:0, 
        agreement_id:parseInt(route.params.id,10) || 0,
        message:"",
        materials:"",
    });

    const SendOrderHandler = async() =>{
        try{
            formData.materials = materialsSend.value;
            formData.manager_card_id = formEmail.value.menagerID;
            const res = await api.post('/order/create', formData);
            console.log(formData)   
            formData.manager_card_id = 0;
            formData.message = "";
            formData.materials = "";

            formEmail.value.menagerID = 0;
            formEmail.value.emailMenager = "";

            selectMaterialsId.value = [];
        }catch(err){
            console.log(err)
        }
    };

    const GetMaterials = async() =>{
        try{
            const res = await api.get('/materials')
            materials.value = res.data
            console.log(res.data)
            console.log(materials.value[0].Estimate.name)
        }catch(err){
            console.log(err)
        }
    };

    const GetEstimate = async()=>{
        try{
            const res = await api.get(`/agreements/${route.params.id}/estimates`);
            estimates.value = res.data;
            console.log(res.data);
        }catch(err){
            console.log(err);
        }
    }

    const GetSuppliers = async() =>{
        try{
            const res = await api.get('/suppliers');
            suppliers.value = res.data;
            console.log(res.data)
        }catch(err){
            console.log(err)
        }
    }
    
    const filter = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        return materials.value.filter(item => {
            const matchesEstimate = !filterEstimate.value || item.Estimate?.name === filterEstimate.value;        
            const matchesQuery = !query || item.Name.toLowerCase().includes(query);
            return matchesEstimate && matchesQuery;
        });
    }); 
    
    const getSendItem = (id) => {

        return materialsSend.value.find(item => item.material_id === id);
    };

    const DeleteMaterialOrder = (id) =>{
        selectMaterialsId.value = selectMaterialsId.value.filter(item => item !== id)
    }

    const selectedMaterials = computed(() => {
        return materials.value.filter(item => selectMaterialsId.value.includes(item.ID));
    });

    watch (selectMaterialsId, (newIds) => {
        materialsSend.value = materialsSend.value.filter(sendItem => newIds.includes(sendItem.id));
        newIds.forEach(id => {
            const alreadyExists = materialsSend.value.some(sendItem => sendItem.id === id);
            if (!alreadyExists) {
                const originalMaterial = materials.value.find(m => m.ID === id);
                materialsSend.value.push({
                    material_id: id,
                    quantity: originalMaterial ? originalMaterial.Quantity : 0, 
                });
            }
        });
    }, { deep: true });


    onMounted(()=>{
        GetMaterials();
        GetEstimate();
        GetSuppliers();
    });
</script>

<style>

</style>