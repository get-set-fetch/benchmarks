# Benchmarks

The goal of these benchmarks is to showcase the [@get-set-fetch/scraper](https://github.com/get-set-fetch/scraper) scalability. By using mocked content and no external traffic, results are not influenced by server response times and upload/download speeds.

A postgresql instance stores the scraping queue. The queue is consumed in parallel by multiple scraper instances with the scraped content saved back in the database.

Benchmarks are executed in cloud using one vm (1vCPU, 1GB memory) for each scraper plus an extra vm (4vCPU, 8GB memory) for the postgresql database. Using DigitalOcean API, the machine sizes are `s-1vcpu-1gb`, `s-4vcpu-8gb` respectively.

Scrapers are started as systemd services invoking the [command line utility](https://getsetfetch.org/node/command-line.html). The entire configuration is deployed using Terraform and Ansible.

There are also some fine grain, plugin level benchmarks available via docker to be run locally.

### 1000K URLs initial queue length

The first scraper instance is responsible for creating the scraping project. It also adds 1000k URLs in the database queue loaded from an external csv file. The remaining scraper instances are in discovery mode, consuming the database queue. Version used: 0.10.0.

<object type="image/svg+xml" data="charts/v0.10-total-exec-time-1e6-saved-entries.svg"></object>

Each scraper instance has a concurrency limit of 100. This means maximum 100 URLs are scraped in parallel. Using 4 instances ~1850 URLs are scraped every second. 8 scraper instances put a 100% CPU load on the vm hosting the database for a total of ~2750 URLs scraped per second. In real world scenarios this will definitely not be your bottleneck.

### 1 URL initial queue length
URLs to-be-scraped are continuously discovered. This scenario simulates scraping result pages with 50 URLs to-be-discovered per page. Only a single scraper instance is used as the queue length always stays under 50.

<object type="image/svg+xml" data="charts/v0.10.0-total-exec-time-1e6-new-entries.svg"></object>

Like in the previous scenario, the scraper instance has a concurrency limit of 100. 
The limit is never reached due to the 50 results per page enforcement. ~210 URLs are scraped every second.

### How to reproduce results

#### 1. Javascript bundling
Bundle typescript plugin and dependencies into a single javascript file. 

Add npm dependencies.
```
npm ci
```

Compile PerfNodeFetchPlugin.ts from typescript to javascript.
```
npx tsc src/plugins/PerfNodeFetchPlugin.ts \
--target esnext --moduleResolution node \
--useDefineForClassFields false --allowSyntheticDefaultImports true \
--skipLibCheck
```

Bundle all plugin imports into a single file availabe under Ansible files.
```
npx rollup --input src/plugins/PerfNodeFetchPlugin.js \
--file cloud/ansible/files/PerfNodeFetchPlugin.js --format cjs --exports named \
--config rollup.config.js
```

#### 2. Setup Terraform
Init terraform.
```
cd cloud/terraform
terrraform init
```

Create SSH keys using OpenSSH `ssh-keygen`.

#### 3. Setup Ansible
In preparation of running ansible playbooks, specify where get-set-fetch Ansible roles and vault password file can be found.
```
cd cloud/ansible
export ANSIBLE_HOST_KEY_CHECKING=False \
export ANSIBLE_ROLES_PATH=$PWD/../../node_modules/@get-set-fetch/scraper/cloud/ansible/ \
export ANSIBLE_VAULT_PASSWORD_FILE=$PWD/../private/vault_pass.txt
```

Specify which scraper version you want to benchmark by modifying `pg-scraper-setup.yml` ansible playbook.
```
scraper:
    npm_install:
        - knex@0.95.14
        - pg@8.7.1
        - cheerio@1.0.0-rc.10
        - "@get-set-fetch/scraper@0.10.0"
```
You can also benchmark a custom scraper version by specyfing a package tarball created via `npm pack`. The file needs to be present under cloud/ansible/files.

Modify the Ansible vault file containing the db user and password. When pulled from the repo it's invalid as it only contain keys and no values. Encrypt it and save the prompted password in a separate file referenced by `ANSIBLE_VAULT_PASSWORD_FILE`.
```
cd ansible
ansible-vault encrypt vault.yml
```

#### 4. Start scraping
Specify the number of scraper instanses in `main.tf`. Create and configure the vms. Assumes you have a DigitalOcean API token and a public/private SSH key pair.
```
cd cloud/terraform

terraform apply -var "api_token="<digitalocean_api_token>" \
-var "public_key_file=<public_key.pub>" \
-var "private_key_file=<private_key>"
```

#### 5. Check progress
Run an ansible playbook to check scrape progress.
```
cd cloud

ansible postgresql -u root -i ansible/inventory/hosts.cfg -m include_role -a "name=gsf-scraper-stats" \
-e 'project_name=top-1 export_file=../results/scraper-progress.csv db_name=getsetfetch db_user=<db_user> db_password=<db_pswd>' \
--private-key <private_key>
```

#### 6. Retrieve benchmarks
```
cd cloud

ansible postgresql -u root -i ansible/inventory/hosts.cfg -m include_role -a "name=gsf-scraper-benchmark" \
-e 'project_name=top-1 export_file=../results/scraper-benchmark.csv db_name=getsetfetch db_user=<db_user> db_password=<db_pswd>' \
--private-key private/do-terraform 
```

#### 7. Plot results
Plot the results from one or more benchmark files. The generated svg is available under `charts`.
```
npm run cloud:benchmark
```


